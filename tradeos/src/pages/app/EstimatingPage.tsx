import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, FileText, Download, Copy, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import jsPDF from 'jspdf';

interface Quote {
  id: string;
  quote_name: string;
  client_gc: string;
  region: string;
  tier_level: 'spec' | 'custom' | 'luxury';
  profit_target_pct: number;
  subtotal: number;
  total: number;
  exclusions: string;
  terms: string;
  created_at: string;
}

interface QuoteLine {
  id: string;
  scope_item: string;
  qty: number;
  unit: string;
  unit_price: number;
  line_total: number;
  price_choice: string;
}

interface ScopeItem {
  id: string;
  scope_item: string;
  unit: string;
  default_low: number;
  default_high: number;
}

const TIER_MULTIPLIERS = { spec: 1.0, custom: 1.15, luxury: 1.35 };

const EstimatingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const showNew = searchParams.get('new') === 'true';
  const { user } = useAuthStore();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [scopeLibrary, setScopeLibrary] = useState<ScopeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(showNew);
  const [activeQuote, setActiveQuote] = useState<Quote | null>(null);
  const [quoteLines, setQuoteLines] = useState<QuoteLine[]>([]);

  const [formData, setFormData] = useState({
    quote_name: '',
    client_gc: '',
    region: '',
    tier_level: 'custom' as const,
    profit_target_pct: 20,
    exclusions: 'Material supply by others\nSite cleanup by GC',
    terms: 'Payment: Net 30\nValid for 30 days',
  });

  useEffect(() => {
    if (user) {
      fetchQuotes();
      fetchScopeLibrary();
    }
  }, [user]);

  const fetchQuotes = async () => {
    const { data } = await supabase
      .from('quotes')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });
    if (data) setQuotes(data);
    setLoading(false);
  };

  const fetchScopeLibrary = async () => {
    const { data } = await supabase
      .from('scope_library')
      .select('*')
      .eq('user_id', user?.id);
    if (data) setScopeLibrary(data);
  };

  const calculateTotals = () => {
    const subtotal = quoteLines.reduce((sum, line) => sum + line.line_total, 0);
    const tierMultiplier = TIER_MULTIPLIERS[formData.tier_level];
    const withTier = subtotal * tierMultiplier;
    const profit = withTier * (formData.profit_target_pct / 100);
    const total = withTier + profit;
    return { subtotal, withTier, profit, total };
  };

  const addLine = () => {
    setQuoteLines([...quoteLines, {
      id: Date.now().toString(),
      scope_item: '',
      qty: 1,
      unit: 'EA',
      unit_price: 0,
      line_total: 0,
      price_choice: 'avg',
    }]);
  };

  const updateLine = (id: string, field: string, value: any) => {
    setQuoteLines(quoteLines.map(line => {
      if (line.id === id) {
        const updated = { ...line, [field]: value };
        if (field === 'scope_item') {
          const scopeItem = scopeLibrary.find(s => s.scope_item === value);
          if (scopeItem) {
            updated.unit = scopeItem.unit;
            updated.unit_price = (scopeItem.default_low + scopeItem.default_high) / 2;
            updated.line_total = updated.qty * updated.unit_price;
          }
        }
        if (field === 'qty' || field === 'unit_price') {
          updated.line_total = updated.qty * updated.unit_price;
        }
        return updated;
      }
      return line;
    }));
  };

  const removeLine = (id: string) => {
    setQuoteLines(quoteLines.filter(line => line.id !== id));
  };

  const handleSaveQuote = async () => {
    const totals = calculateTotals();
    const { data: quote, error } = await supabase
      .from('quotes')
      .insert({
        user_id: user?.id,
        ...formData,
        subtotal: totals.subtotal,
        total: totals.total,
      })
      .select()
      .single();

    if (quote && quoteLines.length > 0) {
      await supabase.from('quote_lines').insert(
        quoteLines.map(line => ({
          user_id: user?.id,
          quote_id: quote.id,
          scope_item: line.scope_item,
          qty: line.qty,
          unit: line.unit,
          unit_price: line.unit_price,
          line_total: line.line_total,
          price_choice: line.price_choice,
        }))
      );
    }

    setShowModal(false);
    setQuoteLines([]);
    setFormData({ quote_name: '', client_gc: '', region: '', tier_level: 'custom', profit_target_pct: 20, exclusions: 'Material supply by others\nSite cleanup by GC', terms: 'Payment: Net 30\nValid for 30 days' });
    fetchQuotes();
  };

  const exportPDF = (quote: Quote) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('GC Summary', 20, 20);
    doc.setFontSize(12);
    doc.text(`Quote: ${quote.quote_name}`, 20, 35);
    doc.text(`Client: ${quote.client_gc}`, 20, 45);
    doc.text(`Total: $${quote.total.toFixed(2)}`, 20, 60);
    doc.text(`Exclusions:`, 20, 80);
    doc.setFontSize(10);
    doc.text(quote.exclusions || '', 20, 90);
    doc.text(`Terms:`, 20, 120);
    doc.text(quote.terms || '', 20, 130);
    doc.save(`Quote-${quote.quote_name}.pdf`);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(value);
  };

  const totals = calculateTotals();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Estimating</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-steel-500 hover:bg-steel-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Quote
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-steel-500"></div>
        </div>
      ) : quotes.length === 0 ? (
        <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-12 text-center">
          <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 mb-4">No quotes yet</p>
          <button
            onClick={() => setShowModal(true)}
            className="bg-steel-500 hover:bg-steel-600 text-white px-4 py-2 rounded-lg font-medium inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Quote
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {quotes.map((quote) => (
            <div key={quote.id} className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">{quote.quote_name}</h3>
                  <p className="text-gray-400">{quote.client_gc} • {quote.region}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => exportPDF(quote)}
                    className="p-2 hover:bg-charcoal-700 rounded-lg text-gray-400 hover:text-white"
                    title="Export PDF"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div>
                  <p className="text-gray-500 text-sm">Subtotal</p>
                  <p className="text-white font-semibold">{formatCurrency(quote.subtotal)}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Tier</p>
                  <p className="text-white font-semibold capitalize">{quote.tier_level}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Total</p>
                  <p className="text-white font-semibold">{formatCurrency(quote.total)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quote Builder Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-charcoal-700 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Quote Builder</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">×</button>
            </div>
            <div className="p-6 space-y-6">
              {/* Quote Info */}
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Quote Name</label>
                  <input
                    type="text"
                    value={formData.quote_name}
                    onChange={(e) => setFormData({...formData, quote_name: e.target.value})}
                    className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-2 text-white"
                    placeholder="123 Main St - Finishing"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Client/GC</label>
                  <input
                    type="text"
                    value={formData.client_gc}
                    onChange={(e) => setFormData({...formData, client_gc: e.target.value})}
                    className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Region</label>
                  <input
                    type="text"
                    value={formData.region}
                    onChange={(e) => setFormData({...formData, region: e.target.value})}
                    className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Tier / Complexity</label>
                  <select
                    value={formData.tier_level}
                    onChange={(e) => setFormData({...formData, tier_level: e.target.value as any})}
                    className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-2 text-white"
                  >
                    <option value="spec">Spec (1.0x)</option>
                    <option value="custom">Custom (1.15x)</option>
                    <option value="luxury">Luxury (1.35x)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Profit Target %</label>
                  <input
                    type="number"
                    value={formData.profit_target_pct}
                    onChange={(e) => setFormData({...formData, profit_target_pct: parseFloat(e.target.value) || 0})}
                    className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-2 text-white"
                  />
                </div>
              </div>

              {/* Line Items */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-white">Line Items</h3>
                  <button
                    onClick={addLine}
                    className="bg-charcoal-700 hover:bg-charcoal-600 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Add Line
                  </button>
                </div>
                
                {quoteLines.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">Add line items to build your quote</p>
                ) : (
                  <div className="space-y-2">
                    {quoteLines.map((line) => (
                      <div key={line.id} className="grid grid-cols-12 gap-2 items-center bg-charcoal-700 p-3 rounded-lg">
                        <div className="col-span-4">
                          <select
                            value={line.scope_item}
                            onChange={(e) => updateLine(line.id, 'scope_item', e.target.value)}
                            className="w-full bg-charcoal-600 border border-charcoal-500 rounded px-2 py-1 text-white text-sm"
                          >
                            <option value="">Select scope...</option>
                            {scopeLibrary.map(s => (
                              <option key={s.id} value={s.scope_item}>{s.scope_item}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-2">
                          <input
                            type="number"
                            value={line.qty}
                            onChange={(e) => updateLine(line.id, 'qty', parseFloat(e.target.value) || 0)}
                            className="w-full bg-charcoal-600 border border-charcoal-500 rounded px-2 py-1 text-white text-sm"
                            placeholder="Qty"
                          />
                        </div>
                        <div className="col-span-1">
                          <span className="text-gray-400 text-sm">{line.unit}</span>
                        </div>
                        <div className="col-span-2">
                          <input
                            type="number"
                            value={line.unit_price}
                            onChange={(e) => updateLine(line.id, 'unit_price', parseFloat(e.target.value) || 0)}
                            className="w-full bg-charcoal-600 border border-charcoal-500 rounded px-2 py-1 text-white text-sm"
                            placeholder="$/unit"
                          />
                        </div>
                        <div className="col-span-2 text-right">
                          <span className="text-white font-medium">{formatCurrency(line.line_total)}</span>
                        </div>
                        <div className="col-span-1">
                          <button onClick={() => removeLine(line.id)} className="text-gray-400 hover:text-risk">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Totals */}
              {quoteLines.length > 0 && (
                <div className="bg-charcoal-700 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-gray-400">
                    <span>Subtotal</span>
                    <span>{formatCurrency(totals.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Tier ({formData.tier_level} × {TIER_MULTIPLIERS[formData.tier_level]})</span>
                    <span>{formatCurrency(totals.withTier)}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Profit ({formData.profit_target_pct}%)</span>
                    <span>{formatCurrency(totals.profit)}</span>
                  </div>
                  <div className="flex justify-between text-white font-semibold text-lg pt-2 border-t border-charcoal-600">
                    <span>Total</span>
                    <span>{formatCurrency(totals.total)}</span>
                  </div>
                </div>
              )}

              {/* Exclusions & Terms */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Exclusions</label>
                  <textarea
                    value={formData.exclusions}
                    onChange={(e) => setFormData({...formData, exclusions: e.target.value})}
                    rows={3}
                    className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-2 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Terms</label>
                  <textarea
                    value={formData.terms}
                    onChange={(e) => setFormData({...formData, terms: e.target.value})}
                    rows={3}
                    className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-2 text-white text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-charcoal-700 hover:bg-charcoal-600 text-white py-3 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveQuote}
                  className="flex-1 bg-steel-500 hover:bg-steel-600 text-white py-3 rounded-lg font-medium"
                >
                  Save Quote
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EstimatingPage;

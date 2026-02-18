import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { 
  Calculator, 
  Plus, 
  FileText, 
  Trash2, 
  Download,
  Save,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { downloadQuotePDF } from '../../utils/pdfGenerator';

const EstimatingPage = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const showNewModal = searchParams.get('new') === 'true';
  const { user, profile } = useAuthStore();
  
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(showNewModal);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Quote form state
  const [quoteForm, setQuoteForm] = useState({
    quote_name: '',
    client_gc: '',
    client_email: '',
    region: '',
    tier_level: 'custom',
    profit_target_pct: 20,
    exclusions: '',
    payment_days: 30,
    quote_valid_days: 30,
    terms: ''
  });
  
  // Quote lines
  const [quoteLines, setQuoteLines] = useState([
    { id: 1, scope_item: '', description: '', qty: 1, unit: 'EA', unit_price: 0, line_total: 0 }
  ]);

  const fetchQuotes = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('quotes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        if (fetchError.code === '42P01') {
          setError('Database tables not yet created. Please run the SQL schema in Supabase.');
        } else {
          throw fetchError;
        }
      } else {
        setQuotes(data || []);
      }
    } catch (err) {
      console.error('Error fetching quotes:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  // Calculate totals
  const subtotal = quoteLines.reduce((sum, line) => sum + (line.line_total || 0), 0);
  const markupAmount = subtotal * (quoteForm.profit_target_pct / 100);
  const total = subtotal + markupAmount;

  const updateLineTotal = (index, field, value) => {
    const newLines = [...quoteLines];
    newLines[index][field] = value;
    
    if (field === 'qty' || field === 'unit_price') {
      newLines[index].line_total = (newLines[index].qty || 0) * (newLines[index].unit_price || 0);
    }
    
    setQuoteLines(newLines);
  };

  const addLine = () => {
    setQuoteLines([
      ...quoteLines,
      { id: Date.now(), scope_item: '', description: '', qty: 1, unit: 'EA', unit_price: 0, line_total: 0 }
    ]);
  };

  const removeLine = (index) => {
    if (quoteLines.length > 1) {
      setQuoteLines(quoteLines.filter((_, i) => i !== index));
    }
  };

  const handleSaveQuote = async () => {
    if (!user) return;
    setIsSaving(true);
    setError(null);

    try {
      // Ensure we have a valid session before saving
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Try to refresh the session
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          throw new Error('Session expired. Please refresh the page and try again.');
        }
      }

      // Generate quote number
      const quoteNumber = `Q-${Date.now().toString(36).toUpperCase()}`;
      
      const quoteData = {
        user_id: user.id,
        quote_number: quoteNumber,
        quote_name: quoteForm.quote_name,
        client_gc: quoteForm.client_gc,
        client_email: quoteForm.client_email,
        region: quoteForm.region,
        tier_level: quoteForm.tier_level,
        profit_target_pct: quoteForm.profit_target_pct,
        subtotal: subtotal,
        markup_amount: markupAmount,
        total: total,
        exclusions: quoteForm.exclusions,
        terms: quoteForm.terms,
        status: 'draft'
      };

      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .insert(quoteData)
        .select()
        .single();

      if (quoteError) {
        if (quoteError.code === '42P01') {
          setError('Database tables not yet created. Please run the SQL schema in Supabase.');
        } else if (quoteError.message?.includes('JWT') || quoteError.code === 'PGRST301') {
          throw new Error('Session expired. Please refresh the page and try again.');
        } else {
          throw quoteError;
        }
        return;
      }

      // Save quote lines
      const linesData = quoteLines.map((line, index) => ({
        user_id: user.id,
        quote_id: quote.id,
        scope_item: line.scope_item,
        description: line.description,
        qty: line.qty,
        unit: line.unit,
        unit_price: line.unit_price,
        line_total: line.line_total,
        sort_order: index
      }));

      const { error: linesError } = await supabase
        .from('quote_lines')
        .insert(linesData);

      if (linesError) throw linesError;

      // Reset form and refresh
      setQuoteForm({
        quote_name: '',
        client_gc: '',
        client_email: '',
        region: '',
        tier_level: 'custom',
        profit_target_pct: 20,
        exclusions: '',
        payment_days: 30,
        quote_valid_days: 30,
        terms: ''
      });
      setQuoteLines([{ id: 1, scope_item: '', description: '', qty: 1, unit: 'EA', unit_price: 0, line_total: 0 }]);
      setIsModalOpen(false);
      fetchQuotes();

    } catch (err) {
      console.error('Error saving quote:', err);
      // Handle abort errors gracefully
      const errorMessage = err.name === 'AbortError' 
        ? 'Request was interrupted. Please try again.'
        : err.message || 'Failed to save quote';
      setError('Failed to save quote: ' + errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const generatePDF = () => {
    // Build quote object from form data with flexible payment terms
    const paymentTermsText = `Payment due within ${quoteForm.payment_days} days of invoice.`;
    const validityText = `Quote valid for ${quoteForm.quote_valid_days} days.`;
    const fullTerms = [paymentTermsText, validityText, quoteForm.terms].filter(Boolean).join('\n');
    
    const quoteData = {
      quote_number: `Q-${Date.now().toString(36).toUpperCase()}`,
      quote_name: quoteForm.quote_name,
      client_gc: quoteForm.client_gc,
      client_email: quoteForm.client_email,
      region: quoteForm.region,
      profit_target_pct: quoteForm.profit_target_pct,
      subtotal: subtotal,
      markup_amount: markupAmount,
      total: total,
      terms: fullTerms,
      exclusions: quoteForm.exclusions,
      status: 'draft',
      created_at: new Date().toISOString(),
      lines: quoteLines.filter(line => line.scope_item)
    };

    const companyInfo = {
      company_name: profile?.company_name || 'TradeOS',
      phone: profile?.phone || '',
      email: user?.email || '',
      address: profile?.region || ''
    };

    downloadQuotePDF(quoteData, companyInfo);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(value || 0);
  };

  return (
    <div className="space-y-6" data-testid="estimating-page">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Estimating</h1>
          <p className="text-gray-400">Create and manage quotes for your projects</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-steel-500 hover:bg-steel-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 w-fit"
          data-testid="new-quote-btn"
        >
          <Plus className="w-5 h-5" />
          New Quote
        </button>
      </div>

      {error && (
        <div className="bg-risk/20 border border-risk/50 text-risk p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Quotes List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-steel-500"></div>
        </div>
      ) : quotes.length === 0 ? (
        <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-12 text-center">
          <Calculator className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Quote Builder</h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            Build professional quotes in minutes with your scope library. Set pricing tiers, add line items, and export to PDF.
          </p>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-steel-500 hover:bg-steel-600 text-white px-4 py-2 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
          >
            <FileText className="w-5 h-5" />
            Create Your First Quote
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {quotes.map((quote) => (
            <div key={quote.id} className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs bg-charcoal-600 text-gray-300 px-2 py-0.5 rounded font-mono">
                      {quote.quote_number}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      quote.status === 'accepted' ? 'bg-success/20 text-success' :
                      quote.status === 'sent' ? 'bg-steel-500/20 text-steel-400' :
                      'bg-charcoal-600 text-gray-400'
                    }`}>
                      {quote.status}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-white">{quote.quote_name}</h3>
                  <p className="text-gray-400 text-sm">{quote.client_gc || 'No client'}</p>
                </div>
                <div className="text-right flex flex-col items-end gap-2">
                  <p className="text-xl font-bold text-white">{formatCurrency(quote.total)}</p>
                  <p className="text-gray-500 text-sm">{new Date(quote.created_at).toLocaleDateString()}</p>
                  <button
                    onClick={() => downloadQuotePDF(quote, {
                      company_name: profile?.company_name || 'TradeOS',
                      phone: profile?.phone || '',
                      email: user?.email || '',
                      address: profile?.region || ''
                    })}
                    className="mt-2 flex items-center gap-1 text-steel-400 hover:text-steel-300 text-sm font-medium transition-colors"
                    data-testid={`download-quote-${quote.id}`}
                  >
                    <Download className="w-4 h-4" />
                    Download PDF
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Feature preview */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-6">
          <h3 className="font-semibold text-white mb-2">Scope Library</h3>
          <p className="text-gray-400 text-sm">Save and reuse common scope items with preset pricing ranges.</p>
        </div>
        <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-6">
          <h3 className="font-semibold text-white mb-2">Pricing Tiers</h3>
          <p className="text-gray-400 text-sm">Set spec, custom, and luxury pricing for flexible quoting.</p>
        </div>
        <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-6">
          <h3 className="font-semibold text-white mb-2">PDF Export</h3>
          <p className="text-gray-400 text-sm">Generate professional PDF quotes with your branding.</p>
        </div>
      </div>

      {/* New Quote Modal */}
      {isModalOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setIsModalOpen(false)} />
          <div className="fixed inset-4 lg:inset-y-4 lg:left-1/2 lg:-translate-x-1/2 lg:w-full lg:max-w-4xl bg-charcoal-800 rounded-2xl border border-charcoal-700 z-50 flex flex-col overflow-hidden" data-testid="quote-builder-modal">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 lg:p-6 border-b border-charcoal-700">
              <h2 className="text-xl font-bold text-white">New Quote</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
              {/* Quote Info */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Quote Name *</label>
                  <input
                    type="text"
                    value={quoteForm.quote_name}
                    onChange={(e) => setQuoteForm({ ...quoteForm, quote_name: e.target.value })}
                    className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-steel-500 focus:ring-1 focus:ring-steel-500"
                    placeholder="e.g., Kitchen Renovation Quote"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Client / GC</label>
                  <input
                    type="text"
                    value={quoteForm.client_gc}
                    onChange={(e) => setQuoteForm({ ...quoteForm, client_gc: e.target.value })}
                    className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-steel-500 focus:ring-1 focus:ring-steel-500"
                    placeholder="Client name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Client Email</label>
                  <input
                    type="email"
                    value={quoteForm.client_email}
                    onChange={(e) => setQuoteForm({ ...quoteForm, client_email: e.target.value })}
                    className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-steel-500 focus:ring-1 focus:ring-steel-500"
                    placeholder="client@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Markup %</label>
                  <input
                    type="number"
                    value={quoteForm.profit_target_pct}
                    onChange={(e) => setQuoteForm({ ...quoteForm, profit_target_pct: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-steel-500 focus:ring-1 focus:ring-steel-500"
                    min="0"
                    max="100"
                  />
                </div>
              </div>

              {/* Line Items */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Line Items</h3>
                  <button
                    type="button"
                    onClick={addLine}
                    className="text-steel-400 hover:text-steel-300 text-sm flex items-center gap-1"
                    data-testid="add-line-btn"
                  >
                    <Plus className="w-4 h-4" />
                    Add Line
                  </button>
                </div>
                
                <div className="space-y-3">
                  {/* Header */}
                  <div className="hidden md:grid md:grid-cols-12 gap-2 text-sm text-gray-500 px-2">
                    <div className="col-span-4">Item</div>
                    <div className="col-span-2">Qty</div>
                    <div className="col-span-2">Unit</div>
                    <div className="col-span-2">Price</div>
                    <div className="col-span-2">Total</div>
                  </div>
                  
                  {quoteLines.map((line, index) => (
                    <div key={line.id} className="grid grid-cols-12 gap-2 items-center bg-charcoal-700/50 p-2 rounded-lg">
                      <input
                        type="text"
                        value={line.scope_item}
                        onChange={(e) => updateLineTotal(index, 'scope_item', e.target.value)}
                        className="col-span-12 md:col-span-4 bg-charcoal-700 border border-charcoal-600 rounded px-3 py-2 text-white text-sm"
                        placeholder="Scope item"
                      />
                      <input
                        type="number"
                        value={line.qty}
                        onChange={(e) => updateLineTotal(index, 'qty', parseFloat(e.target.value) || 0)}
                        className="col-span-4 md:col-span-2 bg-charcoal-700 border border-charcoal-600 rounded px-3 py-2 text-white text-sm"
                        min="0"
                      />
                      <select
                        value={line.unit}
                        onChange={(e) => updateLineTotal(index, 'unit', e.target.value)}
                        className="col-span-4 md:col-span-2 bg-charcoal-700 border border-charcoal-600 rounded px-3 py-2 text-white text-sm"
                      >
                        <option value="EA">EA</option>
                        <option value="LF">LF</option>
                        <option value="SF">SF</option>
                        <option value="HR">HR</option>
                        <option value="LS">LS</option>
                      </select>
                      <input
                        type="number"
                        value={line.unit_price}
                        onChange={(e) => updateLineTotal(index, 'unit_price', parseFloat(e.target.value) || 0)}
                        className="col-span-3 md:col-span-2 bg-charcoal-700 border border-charcoal-600 rounded px-3 py-2 text-white text-sm"
                        min="0"
                        step="0.01"
                      />
                      <div className="col-span-1 md:col-span-2 flex items-center justify-between">
                        <span className="text-white text-sm font-medium">${(line.line_total || 0).toFixed(2)}</span>
                        <button
                          type="button"
                          onClick={() => removeLine(index)}
                          className="text-gray-500 hover:text-risk p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="bg-charcoal-700/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-gray-400">
                  <span>Subtotal</span>
                  <span className="text-white">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Markup ({quoteForm.profit_target_pct}%)</span>
                  <span className="text-white">{formatCurrency(markupAmount)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-charcoal-600">
                  <span className="text-white">Total</span>
                  <span className="text-steel-400">{formatCurrency(total)}</span>
                </div>
              </div>

              {/* Terms & Exclusions */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Payment Terms</label>
                  <div className="flex gap-2 mb-3">
                    {[7, 14, 30, 45, 60].map((days) => (
                      <button
                        key={days}
                        type="button"
                        onClick={() => setQuoteForm({ ...quoteForm, payment_days: days })}
                        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                          quoteForm.payment_days === days
                            ? 'bg-steel-500 text-white'
                            : 'bg-charcoal-600 text-gray-400 hover:text-white'
                        }`}
                      >
                        Net {days}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-sm">Custom:</span>
                    <input
                      type="number"
                      min="1"
                      value={quoteForm.payment_days}
                      onChange={(e) => setQuoteForm({ ...quoteForm, payment_days: parseInt(e.target.value) || 30 })}
                      className="w-20 bg-charcoal-700 border border-charcoal-600 rounded px-3 py-1.5 text-white text-sm focus:border-steel-500 focus:ring-1 focus:ring-steel-500"
                    />
                    <span className="text-gray-400 text-sm">days</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Quote Valid For</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      value={quoteForm.quote_valid_days}
                      onChange={(e) => setQuoteForm({ ...quoteForm, quote_valid_days: parseInt(e.target.value) || 30 })}
                      className="w-20 bg-charcoal-700 border border-charcoal-600 rounded px-3 py-2 text-white focus:border-steel-500 focus:ring-1 focus:ring-steel-500"
                    />
                    <span className="text-gray-400 text-sm">days</span>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Additional Terms</label>
                  <textarea
                    value={quoteForm.terms}
                    onChange={(e) => setQuoteForm({ ...quoteForm, terms: e.target.value })}
                    className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-steel-500 focus:ring-1 focus:ring-steel-500 h-20 resize-none text-sm"
                    placeholder="Additional terms and conditions..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Exclusions</label>
                  <textarea
                    value={quoteForm.exclusions}
                    onChange={(e) => setQuoteForm({ ...quoteForm, exclusions: e.target.value })}
                    className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-steel-500 focus:ring-1 focus:ring-steel-500 h-20 resize-none text-sm"
                    placeholder="Any work not included..."
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex gap-4 p-4 lg:p-6 border-t border-charcoal-700">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 bg-charcoal-700 hover:bg-charcoal-600 text-white py-3 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={generatePDF}
                className="flex-1 bg-charcoal-600 hover:bg-charcoal-500 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                data-testid="export-pdf-btn"
              >
                <Download className="w-5 h-5" />
                Export PDF
              </button>
              <button
                type="button"
                onClick={handleSaveQuote}
                disabled={isSaving || !quoteForm.quote_name}
                className="flex-1 bg-steel-500 hover:bg-steel-600 disabled:opacity-50 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                data-testid="save-quote-btn"
              >
                {isSaving ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Quote
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default EstimatingPage;

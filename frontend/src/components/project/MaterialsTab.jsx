import React, { useState, useEffect } from 'react';
import { 
  Plus, Package, Truck, Wrench, Settings2, Clock, Trash2, 
  Edit2, DollarSign, Receipt, Check, X, ChevronDown
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const CATEGORIES = [
  { value: 'Materials', label: 'Materials', icon: Package },
  { value: 'Consumables', label: 'Consumables', icon: Settings2 },
  { value: 'Tools', label: 'Tools', icon: Wrench },
  { value: 'Equipment', label: 'Equipment', icon: Settings2 },
  { value: 'Rental', label: 'Rental', icon: Clock },
  { value: 'Delivery', label: 'Delivery', icon: Truck },
];

const UNITS = [
  { value: 'ea', label: 'Each' },
  { value: 'box', label: 'Box' },
  { value: 'sheet', label: 'Sheet' },
  { value: 'LF', label: 'Linear Ft' },
  { value: 'SF', label: 'Sq Ft' },
  { value: 'hours', label: 'Hours' },
  { value: 'days', label: 'Days' },
  { value: 'gal', label: 'Gallon' },
  { value: 'lb', label: 'Pound' },
  { value: 'other', label: 'Other' },
];

const TAX_TYPES = [
  { value: 'None', label: 'No Tax' },
  { value: 'GST', label: 'GST (5%)' },
  { value: 'PST', label: 'PST' },
  { value: 'HST', label: 'HST (13%)' },
  { value: 'Sales Tax', label: 'Sales Tax' },
];

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount || 0);
};

const MaterialsTab = ({ projectId }) => {
  const { user } = useAuthStore();
  const [materials, setMaterials] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    item_name: '',
    category: 'Materials',
    vendor: '',
    qty: 1,
    unit: 'ea',
    unit_cost: '',
    tax_type: 'None',
    tax_amount: 0,
    purchased_date: new Date().toISOString().split('T')[0],
    paid_status: 'Unpaid',
    billable: false,
    markup_pct: 0,
    notes: ''
  });

  useEffect(() => {
    if (projectId) {
      fetchMaterials();
    }
  }, [projectId]);

  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      'Authorization': `Bearer ${session?.access_token}`,
      'Content-Type': 'application/json'
    };
  };

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/api/materials?project_id=${projectId}`, { headers });
      
      if (response.ok) {
        const data = await response.json();
        setMaterials(data.materials || []);
        setSummary(data.summary || {});
      } else {
        console.error('Failed to fetch materials');
      }
    } catch (err) {
      console.error('Error fetching materials:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.item_name || !formData.unit_cost) {
      toast.error('Please fill in item name and unit cost');
      return;
    }

    try {
      const headers = await getAuthHeaders();
      const payload = {
        ...formData,
        project_id: projectId,
        unit_cost: parseFloat(formData.unit_cost) || 0,
        qty: parseFloat(formData.qty) || 1,
        tax_amount: parseFloat(formData.tax_amount) || 0,
        markup_pct: parseFloat(formData.markup_pct) || 0
      };

      const url = editingId 
        ? `${API_URL}/api/materials/${editingId}` 
        : `${API_URL}/api/materials`;
      
      const method = editingId ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        toast.success(editingId ? 'Material updated' : 'Material added');
        resetForm();
        fetchMaterials();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to save material');
      }
    } catch (err) {
      console.error('Error saving material:', err);
      toast.error('Failed to save material');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this material?')) return;

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/api/materials/${id}`, {
        method: 'DELETE',
        headers
      });

      if (response.ok) {
        toast.success('Material deleted');
        fetchMaterials();
      } else {
        toast.error('Failed to delete material');
      }
    } catch (err) {
      console.error('Error deleting material:', err);
      toast.error('Failed to delete material');
    }
  };

  const handleEdit = (material) => {
    setFormData({
      item_name: material.item_name || '',
      category: material.category || 'Materials',
      vendor: material.vendor || '',
      qty: material.qty || 1,
      unit: material.unit || 'ea',
      unit_cost: material.unit_cost || '',
      tax_type: material.tax_type || 'None',
      tax_amount: material.tax_amount || 0,
      purchased_date: material.purchased_date || new Date().toISOString().split('T')[0],
      paid_status: material.paid_status || 'Unpaid',
      billable: material.billable || false,
      markup_pct: material.markup_pct || 0,
      notes: material.notes || ''
    });
    setEditingId(material.id);
    setShowAddForm(true);
  };

  const resetForm = () => {
    setFormData({
      item_name: '',
      category: 'Materials',
      vendor: '',
      qty: 1,
      unit: 'ea',
      unit_cost: '',
      tax_type: 'None',
      tax_amount: 0,
      purchased_date: new Date().toISOString().split('T')[0],
      paid_status: 'Unpaid',
      billable: false,
      markup_pct: 0,
      notes: ''
    });
    setEditingId(null);
    setShowAddForm(false);
  };

  const calculateLineTotal = () => {
    const qty = parseFloat(formData.qty) || 0;
    const unitCost = parseFloat(formData.unit_cost) || 0;
    return qty * unitCost;
  };

  const calculateTotalWithTax = () => {
    const lineTotal = calculateLineTotal();
    const taxAmount = parseFloat(formData.tax_amount) || 0;
    return lineTotal + taxAmount;
  };

  const calculateMarkedUpTotal = () => {
    const totalWithTax = calculateTotalWithTax();
    const markupPct = parseFloat(formData.markup_pct) || 0;
    return markupPct > 0 ? totalWithTax * (1 + markupPct / 100) : totalWithTax;
  };

  const getCategoryIcon = (category) => {
    const cat = CATEGORIES.find(c => c.value === category);
    return cat ? cat.icon : Package;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-steel-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="materials-tab">
      {/* Summary Panel */}
      <div className="bg-white rounded-xl border border-cloud-300 p-5">
        <h3 className="text-sm font-semibold text-charcoal-400 uppercase tracking-wider mb-4">Materials Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <p className="text-xs text-charcoal-400 uppercase">Pre-Tax Total</p>
            <p className="text-xl font-bold text-charcoal-800">{formatCurrency(summary.total_pretax)}</p>
          </div>
          <div>
            <p className="text-xs text-charcoal-400 uppercase">Tax Total</p>
            <p className="text-xl font-bold text-charcoal-800">{formatCurrency(summary.total_tax)}</p>
          </div>
          <div>
            <p className="text-xs text-charcoal-400 uppercase">Total w/ Tax</p>
            <p className="text-xl font-bold text-steel-500">{formatCurrency(summary.total_with_tax)}</p>
          </div>
          <div>
            <p className="text-xs text-charcoal-400 uppercase">Billable</p>
            <p className="text-xl font-bold text-success">{formatCurrency(summary.billable_total)}</p>
          </div>
          <div>
            <p className="text-xs text-charcoal-400 uppercase">Non-Billable</p>
            <p className="text-xl font-bold text-charcoal-500">{formatCurrency(summary.non_billable_total)}</p>
          </div>
        </div>
      </div>

      {/* Add Material Button */}
      {!showAddForm && (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full bg-steel-500 hover:bg-steel-600 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors text-lg"
          data-testid="add-material-btn"
        >
          <Plus className="w-6 h-6" />
          Add Material
        </button>
      )}

      {/* Add/Edit Form */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-cloud-300 p-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-charcoal-800">
              {editingId ? 'Edit Material' : 'Add New Material'}
            </h3>
            <button type="button" onClick={resetForm} className="text-charcoal-400 hover:text-charcoal-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Item Name */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-charcoal-600 mb-1">Item Name *</label>
              <input
                type="text"
                value={formData.item_name}
                onChange={(e) => setFormData({...formData, item_name: e.target.value})}
                className="w-full bg-cloud-100 border border-cloud-300 rounded-lg px-4 py-3 text-charcoal-800 focus:border-steel-500 focus:outline-none text-lg"
                placeholder="e.g., 2x4x8 Spruce Studs"
                required
                data-testid="input-item-name"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-charcoal-600 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full bg-cloud-100 border border-cloud-300 rounded-lg px-4 py-3 text-charcoal-800 focus:border-steel-500 focus:outline-none"
                data-testid="select-category"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            {/* Vendor */}
            <div>
              <label className="block text-sm font-medium text-charcoal-600 mb-1">Vendor / Supplier</label>
              <input
                type="text"
                value={formData.vendor}
                onChange={(e) => setFormData({...formData, vendor: e.target.value})}
                className="w-full bg-cloud-100 border border-cloud-300 rounded-lg px-4 py-3 text-charcoal-800 focus:border-steel-500 focus:outline-none"
                placeholder="e.g., Home Depot"
              />
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-charcoal-600 mb-1">Quantity</label>
              <input
                type="number"
                value={formData.qty}
                onChange={(e) => setFormData({...formData, qty: e.target.value})}
                className="w-full bg-cloud-100 border border-cloud-300 rounded-lg px-4 py-3 text-charcoal-800 focus:border-steel-500 focus:outline-none text-lg"
                min="0"
                step="0.01"
                data-testid="input-qty"
              />
            </div>

            {/* Unit */}
            <div>
              <label className="block text-sm font-medium text-charcoal-600 mb-1">Unit</label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({...formData, unit: e.target.value})}
                className="w-full bg-cloud-100 border border-cloud-300 rounded-lg px-4 py-3 text-charcoal-800 focus:border-steel-500 focus:outline-none"
              >
                {UNITS.map(u => (
                  <option key={u.value} value={u.value}>{u.label}</option>
                ))}
              </select>
            </div>

            {/* Unit Cost */}
            <div>
              <label className="block text-sm font-medium text-charcoal-600 mb-1">Unit Cost *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400">$</span>
                <input
                  type="number"
                  value={formData.unit_cost}
                  onChange={(e) => setFormData({...formData, unit_cost: e.target.value})}
                  className="w-full bg-cloud-100 border border-cloud-300 rounded-lg pl-8 pr-4 py-3 text-charcoal-800 focus:border-steel-500 focus:outline-none text-lg"
                  min="0"
                  step="0.01"
                  required
                  data-testid="input-unit-cost"
                />
              </div>
            </div>

            {/* Line Total (calculated) */}
            <div>
              <label className="block text-sm font-medium text-charcoal-600 mb-1">Line Total</label>
              <div className="bg-cloud-200 border border-cloud-300 rounded-lg px-4 py-3 text-charcoal-800 font-semibold text-lg">
                {formatCurrency(calculateLineTotal())}
              </div>
            </div>

            {/* Tax Type */}
            <div>
              <label className="block text-sm font-medium text-charcoal-600 mb-1">Tax Type</label>
              <select
                value={formData.tax_type}
                onChange={(e) => setFormData({...formData, tax_type: e.target.value})}
                className="w-full bg-cloud-100 border border-cloud-300 rounded-lg px-4 py-3 text-charcoal-800 focus:border-steel-500 focus:outline-none"
              >
                {TAX_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            {/* Tax Amount */}
            <div>
              <label className="block text-sm font-medium text-charcoal-600 mb-1">Tax Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400">$</span>
                <input
                  type="number"
                  value={formData.tax_amount}
                  onChange={(e) => setFormData({...formData, tax_amount: e.target.value})}
                  className="w-full bg-cloud-100 border border-cloud-300 rounded-lg pl-8 pr-4 py-3 text-charcoal-800 focus:border-steel-500 focus:outline-none"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            {/* Purchase Date */}
            <div>
              <label className="block text-sm font-medium text-charcoal-600 mb-1">Purchase Date</label>
              <input
                type="date"
                value={formData.purchased_date}
                onChange={(e) => setFormData({...formData, purchased_date: e.target.value})}
                className="w-full bg-cloud-100 border border-cloud-300 rounded-lg px-4 py-3 text-charcoal-800 focus:border-steel-500 focus:outline-none"
              />
            </div>

            {/* Paid Status */}
            <div>
              <label className="block text-sm font-medium text-charcoal-600 mb-1">Paid Status</label>
              <select
                value={formData.paid_status}
                onChange={(e) => setFormData({...formData, paid_status: e.target.value})}
                className="w-full bg-cloud-100 border border-cloud-300 rounded-lg px-4 py-3 text-charcoal-800 focus:border-steel-500 focus:outline-none"
              >
                <option value="Unpaid">Unpaid</option>
                <option value="Paid">Paid</option>
              </select>
            </div>

            {/* Billable Toggle */}
            <div>
              <label className="block text-sm font-medium text-charcoal-600 mb-1">Billable to Client?</label>
              <button
                type="button"
                onClick={() => setFormData({...formData, billable: !formData.billable})}
                className={`w-full py-3 rounded-lg font-medium transition-colors ${
                  formData.billable 
                    ? 'bg-success text-white' 
                    : 'bg-cloud-200 text-charcoal-600 border border-cloud-300'
                }`}
              >
                {formData.billable ? 'Yes - Billable' : 'No - Not Billable'}
              </button>
            </div>

            {/* Markup % (if billable) */}
            {formData.billable && (
              <div>
                <label className="block text-sm font-medium text-charcoal-600 mb-1">Markup %</label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.markup_pct}
                    onChange={(e) => setFormData({...formData, markup_pct: e.target.value})}
                    className="w-full bg-cloud-100 border border-cloud-300 rounded-lg px-4 py-3 pr-8 text-charcoal-800 focus:border-steel-500 focus:outline-none"
                    min="0"
                    step="1"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-400">%</span>
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="lg:col-span-3">
              <label className="block text-sm font-medium text-charcoal-600 mb-1">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="w-full bg-cloud-100 border border-cloud-300 rounded-lg px-4 py-3 text-charcoal-800 focus:border-steel-500 focus:outline-none"
                rows="2"
                placeholder="Optional notes..."
              />
            </div>
          </div>

          {/* Totals Summary */}
          <div className="bg-cloud-100 rounded-lg p-4 mt-4">
            <div className="flex flex-wrap gap-6">
              <div>
                <p className="text-xs text-charcoal-400 uppercase">Total w/ Tax</p>
                <p className="text-2xl font-bold text-charcoal-800">{formatCurrency(calculateTotalWithTax())}</p>
              </div>
              {formData.billable && formData.markup_pct > 0 && (
                <div>
                  <p className="text-xs text-charcoal-400 uppercase">Marked Up Total</p>
                  <p className="text-2xl font-bold text-success">{formatCurrency(calculateMarkedUpTotal())}</p>
                </div>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={resetForm}
              className="flex-1 bg-cloud-200 hover:bg-cloud-300 text-charcoal-600 py-3 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-steel-500 hover:bg-steel-600 text-white py-3 rounded-lg font-semibold transition-colors"
              data-testid="save-material-btn"
            >
              {editingId ? 'Update Material' : 'Add Material'}
            </button>
          </div>
        </form>
      )}

      {/* Materials List */}
      <div className="space-y-3">
        {materials.length === 0 ? (
          <div className="bg-white rounded-xl border border-cloud-300 p-12 text-center">
            <Package className="w-12 h-12 text-charcoal-300 mx-auto mb-4" />
            <p className="text-charcoal-500">No materials added yet</p>
            <p className="text-sm text-charcoal-400 mt-1">Click "Add Material" to start tracking job materials</p>
          </div>
        ) : (
          materials.map((material) => {
            const CategoryIcon = getCategoryIcon(material.category);
            return (
              <div
                key={material.id}
                className="bg-white rounded-xl border border-cloud-300 p-4 hover:border-steel-400 transition-colors"
                data-testid={`material-row-${material.id}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    material.billable ? 'bg-success/10' : 'bg-cloud-200'
                  }`}>
                    <CategoryIcon className={`w-5 h-5 ${material.billable ? 'text-success' : 'text-charcoal-500'}`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="font-semibold text-charcoal-800">{material.item_name}</h4>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <span className="text-xs bg-cloud-200 text-charcoal-600 px-2 py-0.5 rounded">
                            {material.category}
                          </span>
                          {material.vendor && (
                            <span className="text-xs text-charcoal-400">{material.vendor}</span>
                          )}
                          <span className="text-xs text-charcoal-400">
                            {material.qty} {material.unit} × {formatCurrency(material.unit_cost)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-right flex-shrink-0">
                        <p className="text-lg font-bold text-charcoal-800">
                          {formatCurrency(material.total_with_tax)}
                        </p>
                        {material.billable && material.markup_pct > 0 && (
                          <p className="text-sm text-success">
                            Bill: {formatCurrency(material.marked_up_total)}
                          </p>
                        )}
                        <div className="flex items-center gap-1 justify-end mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            material.paid_status === 'Paid' 
                              ? 'bg-success/10 text-success' 
                              : 'bg-warning/10 text-warning'
                          }`}>
                            {material.paid_status}
                          </span>
                          {material.billable && (
                            <span className="text-xs bg-steel-500/10 text-steel-500 px-2 py-0.5 rounded">
                              Billable
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {material.notes && (
                      <p className="text-sm text-charcoal-400 mt-2">{material.notes}</p>
                    )}
                  </div>

                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleEdit(material)}
                      className="p-2 text-charcoal-400 hover:text-steel-500 transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(material.id)}
                      className="p-2 text-charcoal-400 hover:text-risk transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MaterialsTab;

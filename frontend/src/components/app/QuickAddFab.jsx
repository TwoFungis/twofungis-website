import React, { useState, useEffect } from 'react';
import { 
  Plus, X, Fuel, UtensilsCrossed, Wrench, Package, 
  Camera, Check, Loader2, DollarSign, ChevronRight
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import OfflineQueueService from '../../services/OfflineQueueService';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Quick expense categories with defaults
const QUICK_CATEGORIES = [
  { 
    id: 'fuel', 
    name: 'Fuel', 
    icon: Fuel, 
    category: 'Vehicle & Fuel',
    color: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    defaults: { description: 'Fuel', deductibility_pct: 100 }
  },
  { 
    id: 'meal', 
    name: 'Meal', 
    icon: UtensilsCrossed, 
    category: 'Meals & Entertainment',
    color: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    defaults: { description: 'Meal', deductibility_pct: 50 }
  },
  { 
    id: 'tool', 
    name: 'Tool', 
    icon: Wrench, 
    category: 'Tools (<$500)',
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    defaults: { description: 'Tool purchase', deductibility_pct: 100 }
  },
  { 
    id: 'material', 
    name: 'Material', 
    icon: Package, 
    category: 'Materials',
    color: 'bg-green-500/20 text-green-400 border-green-500/30',
    defaults: { description: 'Materials', deductibility_pct: 100 }
  }
];

const QuickAddFab = () => {
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [receiptFile, setReceiptFile] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Form data
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [vendor, setVendor] = useState('');

  // Listen for online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      'Authorization': `Bearer ${session?.access_token}`,
      'Content-Type': 'application/json'
    };
  };

  const resetForm = () => {
    setSelectedCategory(null);
    setAmount('');
    setDescription('');
    setVendor('');
    setReceiptFile(null);
  };

  const handleCategorySelect = (cat) => {
    setSelectedCategory(cat);
    setDescription(cat.defaults.description);
  };

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter an amount');
      return;
    }

    setIsSubmitting(true);

    const expenseData = {
      description: description || selectedCategory.defaults.description,
      amount: parseFloat(amount),
      category: selectedCategory.category,
      vendor: vendor || '',
      expense_date: new Date().toISOString(),
      business_personal: 'Business',
      deductibility_pct: selectedCategory.defaults.deductibility_pct,
      payment_method: 'Cash',
      quick_add: true
    };

    try {
      if (isOnline) {
        // Direct API call when online
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/api/expenses`, {
          method: 'POST',
          headers,
          body: JSON.stringify(expenseData)
        });

        if (!response.ok) {
          throw new Error('Failed to save expense');
        }

        toast.success(`${selectedCategory.name} expense saved!`);
      } else {
        // Queue for later when offline
        OfflineQueueService.addToQueue('expense', expenseData);
        toast.info('Saved offline - will sync when connected');
      }

      // Show success animation
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        resetForm();
        setIsOpen(false);
      }, 1000);

    } catch (err) {
      console.error('Error saving expense:', err);
      // Fallback to offline queue
      OfflineQueueService.addToQueue('expense', expenseData);
      toast.info('Queued for sync');
      resetForm();
      setIsOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhotoCapture = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptFile(file);
      // In a full implementation, we'd upload to storage and attach to expense
      toast.success('Receipt captured');
    }
  };

  if (!user) return null;

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-steel-500 hover:bg-steel-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center group"
        data-testid="quick-add-fab"
        aria-label="Quick Add"
      >
        <Plus className="w-7 h-7 group-hover:rotate-90 transition-transform duration-200" />
      </button>

      {/* Quick Add Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50" onClick={() => setIsOpen(false)}>
          <div 
            className="w-full max-w-sm bg-charcoal-800 rounded-2xl border border-charcoal-700 overflow-hidden animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
            data-testid="quick-add-panel"
          >
            {/* Success State */}
            {showSuccess && (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                  <Check className="w-8 h-8 text-success" />
                </div>
                <p className="text-white font-medium">Saved!</p>
              </div>
            )}

            {/* Category Selection */}
            {!showSuccess && !selectedCategory && (
              <>
                <div className="p-4 border-b border-charcoal-700 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">Quick Add Expense</h3>
                  <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white p-1">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="p-4 grid grid-cols-2 gap-3">
                  {QUICK_CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => handleCategorySelect(cat)}
                        className={`p-4 rounded-xl border ${cat.color} hover:scale-105 transition-all flex flex-col items-center gap-2`}
                        data-testid={`quick-add-${cat.id}`}
                      >
                        <Icon className="w-8 h-8" />
                        <span className="font-medium">{cat.name}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Offline indicator */}
                {!isOnline && (
                  <div className="px-4 pb-4">
                    <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 text-center">
                      <p className="text-warning text-sm">Offline mode - expenses will sync when connected</p>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Amount Entry (3-tap flow) */}
            {!showSuccess && selectedCategory && (
              <>
                <div className="p-4 border-b border-charcoal-700 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setSelectedCategory(null)} 
                      className="text-gray-400 hover:text-white p-1"
                    >
                      <ChevronRight className="w-5 h-5 rotate-180" />
                    </button>
                    <div className="flex items-center gap-2">
                      {React.createElement(selectedCategory.icon, { className: `w-5 h-5 ${selectedCategory.color.split(' ')[1]}` })}
                      <span className="text-white font-medium">{selectedCategory.name}</span>
                    </div>
                  </div>
                  <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white p-1">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-4 space-y-4">
                  {/* Amount - Primary input */}
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Amount *</label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-500" />
                      <input
                        type="number"
                        inputMode="decimal"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full bg-charcoal-700 border border-charcoal-600 rounded-xl pl-14 pr-4 py-4 text-2xl font-bold text-white placeholder-gray-500 focus:border-steel-500 focus:outline-none"
                        placeholder="0.00"
                        autoFocus
                        data-testid="quick-add-amount"
                      />
                    </div>
                  </div>

                  {/* Optional: Vendor */}
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Where? (optional)</label>
                    <input
                      type="text"
                      value={vendor}
                      onChange={(e) => setVendor(e.target.value)}
                      className="w-full bg-charcoal-700 border border-charcoal-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-steel-500 focus:outline-none"
                      placeholder={selectedCategory.id === 'fuel' ? 'Gas station' : selectedCategory.id === 'meal' ? 'Restaurant' : 'Store'}
                      data-testid="quick-add-vendor"
                    />
                  </div>

                  {/* Receipt Photo */}
                  <label className="flex items-center justify-center gap-2 p-3 border border-dashed border-charcoal-600 rounded-xl cursor-pointer hover:border-steel-500 transition-colors">
                    <Camera className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-400 text-sm">
                      {receiptFile ? receiptFile.name : 'Add receipt photo'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={handlePhotoCapture}
                    />
                  </label>

                  {/* Submit Button */}
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !amount}
                    className="w-full bg-steel-500 hover:bg-steel-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                    data-testid="quick-add-submit"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Check className="w-5 h-5" />
                        Save {selectedCategory.name}
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default QuickAddFab;

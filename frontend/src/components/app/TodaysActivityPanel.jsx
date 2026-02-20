import React, { useState, useEffect } from 'react';
import { 
  Receipt, Send, Bell, FolderKanban, 
  Clock, TrendingUp, ChevronRight 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const TodaysActivityPanel = () => {
  const { user } = useAuthStore();
  const [activity, setActivity] = useState({
    expenses: 0,
    invoices: 0,
    reminders: 0,
    projects: 0,
    totalExpenseAmount: 0,
    totalInvoiceAmount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTodaysActivity();
    }
  }, [user]);

  const fetchTodaysActivity = async () => {
    if (!user) return;
    
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();
      
      // Fetch today's expenses
      const { data: expenses } = await supabase
        .from('expenses')
        .select('amount')
        .eq('user_id', user.id)
        .gte('created_at', todayISO);
      
      // Fetch today's invoices
      const { data: invoices } = await supabase
        .from('invoices')
        .select('total')
        .eq('user_id', user.id)
        .gte('created_at', todayISO);

      // Fetch today's reminders sent (via invoices with last_reminder_sent today)
      const { data: reminders } = await supabase
        .from('invoices')
        .select('id')
        .eq('user_id', user.id)
        .gte('last_reminder_sent', todayISO);

      // Fetch today's project updates
      const { data: projects } = await supabase
        .from('projects')
        .select('id')
        .eq('user_id', user.id)
        .gte('updated_at', todayISO);

      const expenseCount = expenses?.length || 0;
      const invoiceCount = invoices?.length || 0;
      const totalExpenseAmount = expenses?.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0) || 0;
      const totalInvoiceAmount = invoices?.reduce((sum, i) => sum + (parseFloat(i.total) || 0), 0) || 0;

      setActivity({
        expenses: expenseCount,
        invoices: invoiceCount,
        reminders: reminders?.length || 0,
        projects: projects?.length || 0,
        totalExpenseAmount,
        totalInvoiceAmount
      });
    } catch (err) {
      console.error('Error fetching activity:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-CA', { 
      style: 'currency', 
      currency: 'CAD', 
      maximumFractionDigits: 0 
    }).format(value || 0);
  };

  const totalActions = activity.expenses + activity.invoices + activity.reminders + activity.projects;

  if (loading) {
    return (
      <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-5" data-testid="todays-activity-panel">
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-charcoal-700 rounded w-1/3" />
          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 bg-charcoal-700 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-5" data-testid="todays-activity-panel">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-steel-400" />
          <h3 className="font-semibold text-white">Today's Activity</h3>
        </div>
        {totalActions > 0 && (
          <span className="text-xs text-gray-500">
            {totalActions} action{totalActions !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Activity Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Expenses Logged */}
        <Link 
          to="/app/expenses"
          className="bg-charcoal-700/50 hover:bg-charcoal-700 rounded-lg p-3 transition-colors group"
        >
          <div className="flex items-center justify-between mb-1">
            <Receipt className="w-4 h-4 text-orange-400" />
            <ChevronRight className="w-3 h-3 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-xl font-bold text-white">{activity.expenses}</p>
          <p className="text-xs text-gray-500">Expenses</p>
          {activity.totalExpenseAmount > 0 && (
            <p className="text-xs text-orange-400 mt-1">{formatCurrency(activity.totalExpenseAmount)}</p>
          )}
        </Link>

        {/* Invoices Sent */}
        <Link 
          to="/app/invoices"
          className="bg-charcoal-700/50 hover:bg-charcoal-700 rounded-lg p-3 transition-colors group"
        >
          <div className="flex items-center justify-between mb-1">
            <Send className="w-4 h-4 text-success" />
            <ChevronRight className="w-3 h-3 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-xl font-bold text-white">{activity.invoices}</p>
          <p className="text-xs text-gray-500">Invoices</p>
          {activity.totalInvoiceAmount > 0 && (
            <p className="text-xs text-success mt-1">{formatCurrency(activity.totalInvoiceAmount)}</p>
          )}
        </Link>

        {/* Reminders Sent */}
        <Link 
          to="/app/receivables"
          className="bg-charcoal-700/50 hover:bg-charcoal-700 rounded-lg p-3 transition-colors group"
        >
          <div className="flex items-center justify-between mb-1">
            <Bell className="w-4 h-4 text-steel-400" />
            <ChevronRight className="w-3 h-3 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-xl font-bold text-white">{activity.reminders}</p>
          <p className="text-xs text-gray-500">Reminders</p>
        </Link>

        {/* Projects Updated */}
        <Link 
          to="/app/projects"
          className="bg-charcoal-700/50 hover:bg-charcoal-700 rounded-lg p-3 transition-colors group"
        >
          <div className="flex items-center justify-between mb-1">
            <FolderKanban className="w-4 h-4 text-blue-400" />
            <ChevronRight className="w-3 h-3 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-xl font-bold text-white">{activity.projects}</p>
          <p className="text-xs text-gray-500">Projects</p>
        </Link>
      </div>

      {/* Empty State */}
      {totalActions === 0 && (
        <div className="mt-3 text-center py-3 bg-charcoal-700/30 rounded-lg">
          <p className="text-gray-500 text-sm">No activity yet today</p>
          <p className="text-xs text-gray-600 mt-1">Use Quick Add (+) to log your first expense</p>
        </div>
      )}
    </div>
  );
};

export default TodaysActivityPanel;

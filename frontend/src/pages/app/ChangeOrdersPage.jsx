import React from 'react';
import { FileText, Plus, Check, Clock, AlertTriangle } from 'lucide-react';

const ChangeOrdersPage = () => {
  // Mock data
  const changeOrders = [
    { id: 1, project: 'Westside Towers', coNumber: 'CO-004', desc: 'Additional trim package - Level 12', value: 8400, status: 'pending', days: 5 },
    { id: 2, project: 'Medical Centre', coNumber: 'CO-012', desc: 'Layout revision - Level 3 exam rooms', value: 12800, status: 'pending', days: 12 },
    { id: 3, project: 'Commercial Retrofit', coNumber: 'CO-002', desc: 'Material upgrade - hardwood to engineered', value: 4200, status: 'approved', days: 0 },
    { id: 4, project: 'Westside Towers', coNumber: 'CO-003', desc: 'Crown molding addition - penthouse', value: 6500, status: 'invoiced', days: 0 },
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="bg-warning/20 text-warning text-xs px-2 py-1 rounded-full flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</span>;
      case 'approved':
        return <span className="bg-success/20 text-success text-xs px-2 py-1 rounded-full flex items-center gap-1"><Check className="w-3 h-3" /> Approved</span>;
      case 'invoiced':
        return <span className="bg-steel-500/20 text-steel-400 text-xs px-2 py-1 rounded-full flex items-center gap-1"><FileText className="w-3 h-3" /> Invoiced</span>;
      default:
        return null;
    }
  };

  const pendingTotal = changeOrders.filter(co => co.status === 'pending').reduce((sum, co) => sum + co.value, 0);

  return (
    <div className="space-y-6" data-testid="change-orders-page">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Change Orders</h1>
          <p className="text-gray-400">Track and manage all change orders across projects</p>
        </div>
        <button className="bg-steel-500 hover:bg-steel-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 w-fit">
          <Plus className="w-5 h-5" />
          New Change Order
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-charcoal-800 rounded-xl p-4 border border-charcoal-700">
          <p className="text-gray-500 text-sm mb-1">Pending Value</p>
          <p className="text-2xl font-bold text-warning">${pendingTotal.toLocaleString()}</p>
        </div>
        <div className="bg-charcoal-800 rounded-xl p-4 border border-charcoal-700">
          <p className="text-gray-500 text-sm mb-1">Pending COs</p>
          <p className="text-2xl font-bold text-white">{changeOrders.filter(co => co.status === 'pending').length}</p>
        </div>
        <div className="bg-charcoal-800 rounded-xl p-4 border border-charcoal-700">
          <p className="text-gray-500 text-sm mb-1">Approved (This Month)</p>
          <p className="text-2xl font-bold text-success">$4,200</p>
        </div>
        <div className="bg-charcoal-800 rounded-xl p-4 border border-charcoal-700">
          <p className="text-gray-500 text-sm mb-1">Awaiting Invoice</p>
          <p className="text-2xl font-bold text-white">1</p>
        </div>
      </div>

      {/* Change Orders List */}
      <div className="bg-charcoal-800 rounded-xl border border-charcoal-700">
        <div className="p-4 lg:p-6 border-b border-charcoal-700">
          <h2 className="text-lg font-semibold text-white">All Change Orders</h2>
        </div>
        <div className="divide-y divide-charcoal-700">
          {changeOrders.map((co) => (
            <div key={co.id} className="p-4 lg:p-6 hover:bg-charcoal-700/50 transition-colors cursor-pointer">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm bg-charcoal-600 text-gray-300 px-2 py-0.5 rounded font-mono">{co.coNumber}</span>
                    <span className="text-gray-500 text-sm">{co.project}</span>
                    {getStatusBadge(co.status)}
                  </div>
                  <p className="text-white font-medium mb-2">{co.desc}</p>
                  {co.status === 'pending' && co.days > 7 && (
                    <div className="flex items-center gap-2 text-xs text-warning">
                      <AlertTriangle className="w-3 h-3" />
                      <span>{co.days} days pending - follow up recommended</span>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-white">${co.value.toLocaleString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChangeOrdersPage;

import React from 'react';
import { ClipboardList, Plus, Calendar, Users, CheckSquare } from 'lucide-react';

const ProductionPage = () => {
  // Mock data
  const logs = [
    { id: 1, project: 'Westside Towers', date: '2026-01-15', crew: 3, scope: 'Base molding install - Level 11', units: 450, hours: 24, issues: '' },
    { id: 2, project: 'Medical Centre', date: '2026-01-15', crew: 4, scope: 'Door casing - Level 2', units: 28, hours: 32, issues: 'Material shortage - trim pieces' },
    { id: 3, project: 'Westside Towers', date: '2026-01-14', crew: 3, scope: 'Crown molding - Level 10', units: 320, hours: 24, issues: '' },
    { id: 4, project: 'Commercial Retrofit', date: '2026-01-14', crew: 2, scope: 'Hardwood flooring - Main floor', units: 180, hours: 16, issues: '' },
  ];

  return (
    <div className="space-y-6" data-testid="production-page">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Production Logs</h1>
          <p className="text-gray-400">Track daily crew production and progress</p>
        </div>
        <button className="bg-steel-500 hover:bg-steel-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 w-fit">
          <Plus className="w-5 h-5" />
          New Daily Log
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-charcoal-800 rounded-xl p-4 border border-charcoal-700">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">Today</span>
          </div>
          <p className="text-2xl font-bold text-white">2</p>
          <p className="text-sm text-gray-400">Logs entered</p>
        </div>
        <div className="bg-charcoal-800 rounded-xl p-4 border border-charcoal-700">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <Users className="w-4 h-4" />
            <span className="text-sm">Crew Hours</span>
          </div>
          <p className="text-2xl font-bold text-white">56</p>
          <p className="text-sm text-gray-400">Today</p>
        </div>
        <div className="bg-charcoal-800 rounded-xl p-4 border border-charcoal-700">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <CheckSquare className="w-4 h-4" />
            <span className="text-sm">Units</span>
          </div>
          <p className="text-2xl font-bold text-white">478</p>
          <p className="text-sm text-gray-400">Installed today</p>
        </div>
        <div className="bg-charcoal-800 rounded-xl p-4 border border-charcoal-700">
          <div className="flex items-center gap-2 text-warning mb-2">
            <ClipboardList className="w-4 h-4" />
            <span className="text-sm">Issues</span>
          </div>
          <p className="text-2xl font-bold text-warning">1</p>
          <p className="text-sm text-gray-400">Reported</p>
        </div>
      </div>

      {/* Logs List */}
      <div className="bg-charcoal-800 rounded-xl border border-charcoal-700">
        <div className="p-4 lg:p-6 border-b border-charcoal-700">
          <h2 className="text-lg font-semibold text-white">Recent Logs</h2>
        </div>
        <div className="divide-y divide-charcoal-700">
          {logs.map((log) => (
            <div key={log.id} className="p-4 lg:p-6 hover:bg-charcoal-700/50 transition-colors cursor-pointer">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm text-gray-500">{log.date}</span>
                    <span className="text-gray-600">•</span>
                    <span className="text-sm text-gray-400">{log.project}</span>
                  </div>
                  <p className="text-white font-medium mb-2">{log.scope}</p>
                  {log.issues && (
                    <p className="text-warning text-sm">Issue: {log.issues}</p>
                  )}
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div>
                    <p className="text-gray-500">Crew</p>
                    <p className="text-white font-medium">{log.crew}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Hours</p>
                    <p className="text-white font-medium">{log.hours}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Units</p>
                    <p className="text-white font-medium">{log.units}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductionPage;

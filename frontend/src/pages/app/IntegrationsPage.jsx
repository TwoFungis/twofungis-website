import React, { useState } from 'react';
import { Link2, Check, X, RefreshCw, AlertCircle, Settings, FileText, Wallet } from 'lucide-react';
import { toast } from 'sonner';

const IntegrationsPage = () => {
  // QuickBooks connection state (mocked)
  const [quickbooksConnected, setQuickbooksConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [syncSettings, setSyncSettings] = useState({
    syncInvoices: true,
    syncExpenses: true
  });
  const [lastSync, setLastSync] = useState(null);

  const handleConnectQuickBooks = async () => {
    setIsConnecting(true);
    
    // Simulated OAuth flow
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setQuickbooksConnected(true);
    setLastSync(new Date().toISOString());
    toast.success('QuickBooks connected successfully!');
    setIsConnecting(false);
  };

  const handleDisconnect = () => {
    setQuickbooksConnected(false);
    setLastSync(null);
    toast.info('QuickBooks disconnected');
  };

  const handleManualSync = async () => {
    if (!quickbooksConnected) return;
    
    toast.info('Syncing data to QuickBooks...');
    await new Promise(resolve => setTimeout(resolve, 1500));
    setLastSync(new Date().toISOString());
    toast.success('Sync complete!');
  };

  return (
    <div className="space-y-6" data-testid="integrations-page">
      {/* Header with Shield */}
      <div className="flex items-center gap-3">
        <img src="/shield-icon.png" alt="" className="w-8 h-8 opacity-80" />
        <div>
          <h1 className="text-2xl font-bold text-charcoal-800">Integrations</h1>
          <p className="text-charcoal-600 text-sm">Connect your business tools for seamless data flow</p>
        </div>
      </div>

      {/* QuickBooks Integration Card */}
      <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 overflow-hidden">
        <div className="p-6 border-b border-charcoal-700">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#2CA01C] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">QB</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">QuickBooks Online</h3>
                <p className="text-gray-400 text-sm">Sync invoices and expenses to QuickBooks</p>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${
              quickbooksConnected 
                ? 'bg-success/20 text-success' 
                : 'bg-charcoal-600 text-gray-400'
            }`}>
              {quickbooksConnected ? (
                <>
                  <Check className="w-4 h-4" />
                  Connected
                </>
              ) : (
                'Not Connected'
              )}
            </div>
          </div>
        </div>

        <div className="p-6">
          {!quickbooksConnected ? (
            <div className="text-center py-6">
              <Link2 className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <h4 className="text-white font-medium mb-2">Connect QuickBooks</h4>
              <p className="text-gray-400 text-sm mb-6 max-w-md mx-auto">
                Push your TradeOS invoices and expenses directly to QuickBooks Online. 
                One-way sync keeps your books up to date automatically.
              </p>
              <button
                onClick={handleConnectQuickBooks}
                disabled={isConnecting}
                className="bg-[#2CA01C] hover:bg-[#248517] text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center gap-2 disabled:opacity-50"
                data-testid="connect-quickbooks-btn"
              >
                {isConnecting ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Link2 className="w-5 h-5" />
                    Connect QuickBooks
                  </>
                )}
              </button>
              <p className="text-gray-500 text-xs mt-4">
                You'll be redirected to QuickBooks to authorize the connection
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Sync Settings */}
              <div>
                <h4 className="text-white font-medium mb-4 flex items-center gap-2">
                  <Settings className="w-4 h-4 text-gray-400" />
                  Sync Settings
                </h4>
                <div className="space-y-3">
                  <label className="flex items-center justify-between p-4 bg-charcoal-700/50 rounded-lg cursor-pointer hover:bg-charcoal-700 transition-colors">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-steel-400" />
                      <div>
                        <p className="text-white font-medium">Sync Invoices</p>
                        <p className="text-gray-400 text-sm">Push invoices to QuickBooks when created</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={syncSettings.syncInvoices}
                      onChange={(e) => setSyncSettings({ ...syncSettings, syncInvoices: e.target.checked })}
                      className="w-5 h-5 rounded border-charcoal-600 text-steel-500 focus:ring-steel-500 focus:ring-offset-charcoal-800"
                    />
                  </label>
                  
                  <label className="flex items-center justify-between p-4 bg-charcoal-700/50 rounded-lg cursor-pointer hover:bg-charcoal-700 transition-colors">
                    <div className="flex items-center gap-3">
                      <Wallet className="w-5 h-5 text-steel-400" />
                      <div>
                        <p className="text-white font-medium">Sync Expenses</p>
                        <p className="text-gray-400 text-sm">Push expenses to QuickBooks when recorded</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={syncSettings.syncExpenses}
                      onChange={(e) => setSyncSettings({ ...syncSettings, syncExpenses: e.target.checked })}
                      className="w-5 h-5 rounded border-charcoal-600 text-steel-500 focus:ring-steel-500 focus:ring-offset-charcoal-800"
                    />
                  </label>
                </div>
              </div>

              {/* Sync Status */}
              <div className="flex items-center justify-between p-4 bg-charcoal-700/30 rounded-lg">
                <div>
                  <p className="text-gray-400 text-sm">Last synced</p>
                  <p className="text-white font-medium">
                    {lastSync ? new Date(lastSync).toLocaleString() : 'Never'}
                  </p>
                </div>
                <button
                  onClick={handleManualSync}
                  className="bg-charcoal-600 hover:bg-charcoal-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Sync Now
                </button>
              </div>

              {/* Disconnect */}
              <div className="pt-4 border-t border-charcoal-700">
                <button
                  onClick={handleDisconnect}
                  className="text-gray-400 hover:text-risk text-sm flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  Disconnect QuickBooks
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Coming Soon - Other Integrations */}
      <div className="bg-charcoal-800/50 rounded-xl border border-charcoal-700/50 p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="w-5 h-5 text-gray-500" />
          <h3 className="text-gray-400 font-medium">More Integrations Coming Soon</h3>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="bg-charcoal-700/30 rounded-lg p-4 opacity-60">
            <div className="w-10 h-10 bg-charcoal-600 rounded-lg flex items-center justify-center mb-3">
              <span className="text-gray-400 font-bold">Xero</span>
            </div>
            <p className="text-gray-400 text-sm">Xero Accounting</p>
          </div>
          <div className="bg-charcoal-700/30 rounded-lg p-4 opacity-60">
            <div className="w-10 h-10 bg-charcoal-600 rounded-lg flex items-center justify-center mb-3">
              <span className="text-gray-400 font-bold text-xs">SAGE</span>
            </div>
            <p className="text-gray-400 text-sm">Sage 50</p>
          </div>
          <div className="bg-charcoal-700/30 rounded-lg p-4 opacity-60">
            <div className="w-10 h-10 bg-charcoal-600 rounded-lg flex items-center justify-center mb-3">
              <span className="text-gray-400 font-bold text-xs">PROC</span>
            </div>
            <p className="text-gray-400 text-sm">Procore</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntegrationsPage;

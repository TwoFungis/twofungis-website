import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, DollarSign } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';

interface LaborProfile {
  id: string;
  name: string;
  wage: number;
  cpp_ei_pct: number;
  worksafe_pct: number;
  vacation_pct: number;
  fuel_per_hr: number;
  tool_wear_per_hr: number;
  insurance_per_hr: number;
  overhead_pct: number;
  target_margin_pct: number;
}

const LaborPage: React.FC = () => {
  const { user } = useAuthStore();
  const [profiles, setProfiles] = useState<LaborProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<LaborProfile | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    wage: 35,
    cpp_ei_pct: 5.95,
    worksafe_pct: 2.5,
    vacation_pct: 4,
    fuel_per_hr: 3,
    tool_wear_per_hr: 2,
    insurance_per_hr: 1.5,
    overhead_pct: 15,
    target_margin_pct: 20,
  });

  useEffect(() => {
    if (user) fetchProfiles();
  }, [user]);

  const fetchProfiles = async () => {
    const { data } = await supabase
      .from('labor_profiles')
      .select('*')
      .eq('user_id', user?.id);
    if (data) setProfiles(data);
    setLoading(false);
  };

  const calculateCosts = (profile: typeof formData) => {
    const burdenPct = profile.cpp_ei_pct + profile.worksafe_pct + profile.vacation_pct;
    const laborBurden = profile.wage * (burdenPct / 100);
    const directCosts = profile.fuel_per_hr + profile.tool_wear_per_hr + profile.insurance_per_hr;
    const subtotal = profile.wage + laborBurden + directCosts;
    const overhead = subtotal * (profile.overhead_pct / 100);
    const trueCost = subtotal + overhead;
    const billableRate = trueCost / (1 - profile.target_margin_pct / 100);
    return { trueCost, billableRate };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      await supabase.from('labor_profiles').update(formData).eq('id', editing.id);
    } else {
      await supabase.from('labor_profiles').insert({ ...formData, user_id: user?.id });
    }
    setShowModal(false);
    setEditing(null);
    fetchProfiles();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this labor profile?')) {
      await supabase.from('labor_profiles').delete().eq('id', id);
      fetchProfiles();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Labor Cost Engine</h1>
          <p className="text-gray-400">Calculate true labor costs and billable rates</p>
        </div>
        <button
          onClick={() => { setEditing(null); setFormData({ name: '', wage: 35, cpp_ei_pct: 5.95, worksafe_pct: 2.5, vacation_pct: 4, fuel_per_hr: 3, tool_wear_per_hr: 2, insurance_per_hr: 1.5, overhead_pct: 15, target_margin_pct: 20 }); setShowModal(true); }}
          className="bg-steel-500 hover:bg-steel-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Profile
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-steel-500"></div>
        </div>
      ) : profiles.length === 0 ? (
        <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-12 text-center">
          <DollarSign className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 mb-4">No labor profiles yet</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles.map((profile) => {
            const costs = calculateCosts(profile);
            return (
              <div key={profile.id} className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">{profile.name}</h3>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditing(profile); setFormData(profile); setShowModal(true); }} className="p-2 hover:bg-charcoal-700 rounded text-gray-400 hover:text-white">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(profile.id)} className="p-2 hover:bg-charcoal-700 rounded text-gray-400 hover:text-risk">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Base Wage</span>
                    <span className="text-white">${profile.wage}/hr</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Burden (CPP/EI/WS/Vac)</span>
                    <span className="text-white">{(profile.cpp_ei_pct + profile.worksafe_pct + profile.vacation_pct).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Direct Costs</span>
                    <span className="text-white">${(profile.fuel_per_hr + profile.tool_wear_per_hr + profile.insurance_per_hr).toFixed(2)}/hr</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Overhead</span>
                    <span className="text-white">{profile.overhead_pct}%</span>
                  </div>
                  <div className="border-t border-charcoal-600 pt-3 mt-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">True Cost/Hr</span>
                      <span className="text-warning font-semibold">${costs.trueCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between mt-2">
                      <span className="text-gray-400">Billable Rate ({profile.target_margin_pct}% margin)</span>
                      <span className="text-success font-semibold">${costs.billableRate.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-charcoal-700">
              <h2 className="text-xl font-semibold text-white">{editing ? 'Edit' : 'New'} Labor Profile</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Profile Name</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-2 text-white" placeholder="e.g., Journeyman" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Hourly Wage ($)</label>
                  <input type="number" step="0.01" value={formData.wage} onChange={(e) => setFormData({...formData, wage: parseFloat(e.target.value) || 0})} className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-2 text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">CPP/EI (%)</label>
                  <input type="number" step="0.01" value={formData.cpp_ei_pct} onChange={(e) => setFormData({...formData, cpp_ei_pct: parseFloat(e.target.value) || 0})} className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-2 text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">WorkSafe (%)</label>
                  <input type="number" step="0.01" value={formData.worksafe_pct} onChange={(e) => setFormData({...formData, worksafe_pct: parseFloat(e.target.value) || 0})} className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-2 text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Vacation (%)</label>
                  <input type="number" step="0.01" value={formData.vacation_pct} onChange={(e) => setFormData({...formData, vacation_pct: parseFloat(e.target.value) || 0})} className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-2 text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Fuel/Hr ($)</label>
                  <input type="number" step="0.01" value={formData.fuel_per_hr} onChange={(e) => setFormData({...formData, fuel_per_hr: parseFloat(e.target.value) || 0})} className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-2 text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Tool Wear/Hr ($)</label>
                  <input type="number" step="0.01" value={formData.tool_wear_per_hr} onChange={(e) => setFormData({...formData, tool_wear_per_hr: parseFloat(e.target.value) || 0})} className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-2 text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Insurance/Hr ($)</label>
                  <input type="number" step="0.01" value={formData.insurance_per_hr} onChange={(e) => setFormData({...formData, insurance_per_hr: parseFloat(e.target.value) || 0})} className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-2 text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Overhead (%)</label>
                  <input type="number" step="0.01" value={formData.overhead_pct} onChange={(e) => setFormData({...formData, overhead_pct: parseFloat(e.target.value) || 0})} className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-2 text-white" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Target Margin (%)</label>
                  <input type="number" step="0.01" value={formData.target_margin_pct} onChange={(e) => setFormData({...formData, target_margin_pct: parseFloat(e.target.value) || 0})} className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-2 text-white" />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-charcoal-700 hover:bg-charcoal-600 text-white py-2 rounded-lg font-medium">Cancel</button>
                <button type="submit" className="flex-1 bg-steel-500 hover:bg-steel-600 text-white py-2 rounded-lg font-medium">{editing ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LaborPage;

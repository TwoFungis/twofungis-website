import React, { useState } from 'react';
import { Users, Plus, Calculator, DollarSign } from 'lucide-react';

const LaborPage = () => {
  const [wage, setWage] = useState(35);
  const [cppEi, setCppEi] = useState(7.5);
  const [worksafe, setWorksafe] = useState(3.2);
  const [vacation, setVacation] = useState(4);
  const [fuel, setFuel] = useState(5);
  const [toolWear, setToolWear] = useState(3);
  const [insurance, setInsurance] = useState(2);
  const [overhead, setOverhead] = useState(15);
  const [margin, setMargin] = useState(20);

  // Calculate burdened rate
  const burdens = (wage * (cppEi + worksafe + vacation) / 100);
  const hourlyAddons = fuel + toolWear + insurance;
  const subtotal = wage + burdens + hourlyAddons;
  const overheadAmount = subtotal * (overhead / 100);
  const totalCost = subtotal + overheadAmount;
  const billableRate = totalCost / (1 - margin / 100);

  return (
    <div className="space-y-6" data-testid="labor-page">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Labor Cost Engine</h1>
          <p className="text-gray-400">Calculate true labor costs and billable rates</p>
        </div>
        <button className="bg-steel-500 hover:bg-steel-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 w-fit">
          <Plus className="w-5 h-5" />
          Save Profile
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Calculator Inputs */}
        <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-6 space-y-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Calculator className="w-5 h-5 text-steel-400" />
            Cost Calculator
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Base Hourly Wage ($)</label>
            <input
              type="number"
              value={wage}
              onChange={(e) => setWage(parseFloat(e.target.value) || 0)}
              className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-3 text-white focus:border-steel-500 focus:ring-1 focus:ring-steel-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">CPP/EI (%)</label>
              <input
                type="number"
                step="0.1"
                value={cppEi}
                onChange={(e) => setCppEi(parseFloat(e.target.value) || 0)}
                className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-3 text-white focus:border-steel-500 focus:ring-1 focus:ring-steel-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">WorkSafe (%)</label>
              <input
                type="number"
                step="0.1"
                value={worksafe}
                onChange={(e) => setWorksafe(parseFloat(e.target.value) || 0)}
                className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-3 text-white focus:border-steel-500 focus:ring-1 focus:ring-steel-500 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Vacation Pay (%)</label>
              <input
                type="number"
                step="0.1"
                value={vacation}
                onChange={(e) => setVacation(parseFloat(e.target.value) || 0)}
                className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-3 text-white focus:border-steel-500 focus:ring-1 focus:ring-steel-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Fuel ($/hr)</label>
              <input
                type="number"
                step="0.5"
                value={fuel}
                onChange={(e) => setFuel(parseFloat(e.target.value) || 0)}
                className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-3 text-white focus:border-steel-500 focus:ring-1 focus:ring-steel-500 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Tool Wear ($/hr)</label>
              <input
                type="number"
                step="0.5"
                value={toolWear}
                onChange={(e) => setToolWear(parseFloat(e.target.value) || 0)}
                className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-3 text-white focus:border-steel-500 focus:ring-1 focus:ring-steel-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Insurance ($/hr)</label>
              <input
                type="number"
                step="0.5"
                value={insurance}
                onChange={(e) => setInsurance(parseFloat(e.target.value) || 0)}
                className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-3 text-white focus:border-steel-500 focus:ring-1 focus:ring-steel-500 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Overhead (%)</label>
              <input
                type="number"
                step="1"
                value={overhead}
                onChange={(e) => setOverhead(parseFloat(e.target.value) || 0)}
                className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-3 text-white focus:border-steel-500 focus:ring-1 focus:ring-steel-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Target Margin (%)</label>
              <input
                type="number"
                step="1"
                value={margin}
                onChange={(e) => setMargin(parseFloat(e.target.value) || 0)}
                className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-3 text-white focus:border-steel-500 focus:ring-1 focus:ring-steel-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-6">
          <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-6">
              <DollarSign className="w-5 h-5 text-steel-400" />
              Cost Breakdown
            </h2>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-charcoal-700">
                <span className="text-gray-400">Base Wage</span>
                <span className="text-white font-medium">${wage.toFixed(2)}/hr</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-charcoal-700">
                <span className="text-gray-400">Payroll Burdens</span>
                <span className="text-white font-medium">+${burdens.toFixed(2)}/hr</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-charcoal-700">
                <span className="text-gray-400">Hourly Add-ons</span>
                <span className="text-white font-medium">+${hourlyAddons.toFixed(2)}/hr</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-charcoal-700">
                <span className="text-gray-400">Subtotal</span>
                <span className="text-white font-medium">${subtotal.toFixed(2)}/hr</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-charcoal-700">
                <span className="text-gray-400">Overhead ({overhead}%)</span>
                <span className="text-white font-medium">+${overheadAmount.toFixed(2)}/hr</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-charcoal-700">
                <span className="text-white font-medium">Total Cost</span>
                <span className="text-warning font-bold">${totalCost.toFixed(2)}/hr</span>
              </div>
            </div>
          </div>

          <div className="bg-steel-500/10 border border-steel-500/30 rounded-xl p-6">
            <p className="text-steel-400 text-sm mb-2">Billable Rate ({margin}% margin)</p>
            <p className="text-4xl font-bold text-white">${billableRate.toFixed(2)}<span className="text-lg text-gray-400">/hr</span></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LaborPage;

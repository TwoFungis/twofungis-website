import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Info,
  DollarSign,
  Percent,
  Calendar,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  PiggyBank
} from 'lucide-react';

// Tax brackets for Canada (2026 Federal + Ontario as example)
const CANADA_TAX_BRACKETS = {
  federal: [
    { min: 0, max: 55867, rate: 15 },
    { min: 55867, max: 111733, rate: 20.5 },
    { min: 111733, max: 173205, rate: 26 },
    { min: 173205, max: 246752, rate: 29 },
    { min: 246752, max: Infinity, rate: 33 }
  ],
  provincial: { // Ontario rates
    rate: 11.16 // Simplified average
  },
  cpp: 5.95, // CPP contribution rate
  ei: 1.63, // EI rate (if applicable)
  hstRate: 13 // Ontario HST
};

// US Tax brackets (2026 estimated)
const US_TAX_BRACKETS = {
  federal: [
    { min: 0, max: 11600, rate: 10 },
    { min: 11600, max: 47150, rate: 12 },
    { min: 47150, max: 100525, rate: 22 },
    { min: 100525, max: 191950, rate: 24 },
    { min: 191950, max: 243725, rate: 32 },
    { min: 243725, max: 609350, rate: 35 },
    { min: 609350, max: Infinity, rate: 37 }
  ],
  selfEmploymentTax: 15.3, // Social Security + Medicare
  avgStateRate: 5 // Average state tax
};

// Deduction categories and tips
const DEDUCTION_TIPS = {
  'Materials': {
    deductible: true,
    percentage: 100,
    tip: 'Fully deductible as cost of goods sold. Keep all receipts.',
    example: 'Lumber, drywall, paint, fixtures, hardware'
  },
  'Labor': {
    deductible: true,
    percentage: 100,
    tip: 'Wages paid to employees or subcontractors are fully deductible.',
    example: 'Subcontractor payments, helper wages'
  },
  'Equipment': {
    deductible: true,
    percentage: 100,
    tip: 'Can be depreciated over time or fully deducted under Section 179 (US) / CCA (Canada).',
    example: 'Power tools, scaffolding, heavy equipment'
  },
  'Vehicle/Fuel': {
    deductible: true,
    percentage: 85,
    tip: 'Track business vs personal use. Use logbook method or standard mileage rate.',
    example: 'Work truck fuel, maintenance, insurance (business portion)'
  },
  'Tools': {
    deductible: true,
    percentage: 100,
    tip: 'Small tools under $500 can usually be expensed immediately.',
    example: 'Hand tools, drill bits, saw blades'
  },
  'Office': {
    deductible: true,
    percentage: 100,
    tip: 'Home office deduction available if you have dedicated workspace.',
    example: 'Computer, printer, office supplies, software subscriptions'
  },
  'Insurance': {
    deductible: true,
    percentage: 100,
    tip: 'Business insurance premiums are fully deductible.',
    example: 'Liability insurance, workers comp, equipment insurance'
  },
  'Professional Fees': {
    deductible: true,
    percentage: 100,
    tip: 'Accountant, lawyer, and consultant fees are deductible.',
    example: 'Bookkeeper, CPA, legal fees, permit fees'
  },
  'Meals & Entertainment': {
    deductible: true,
    percentage: 50,
    tip: 'Only 50% deductible. Must be business-related with documentation.',
    example: 'Client meals, team lunches on job site'
  },
  'Travel': {
    deductible: true,
    percentage: 100,
    tip: 'Travel for business purposes. Keep detailed records.',
    example: 'Hotels, flights, parking for out-of-town jobs'
  },
  'Utilities': {
    deductible: true,
    percentage: 100,
    tip: 'Business portion of phone, internet, and utilities.',
    example: 'Cell phone (business %), shop utilities'
  },
  'Rent': {
    deductible: true,
    percentage: 100,
    tip: 'Shop, warehouse, or office rent is fully deductible.',
    example: 'Workshop rent, storage unit, equipment yard'
  },
  'Other': {
    deductible: true,
    percentage: 50,
    tip: 'Varies by expense type. Consult with your accountant.',
    example: 'Miscellaneous business expenses'
  }
};

const TaxAdvisor = ({ 
  totalIncome = 0, 
  totalExpenses = 0, 
  expensesByCategory = {},
  region = 'CA' 
}) => {
  const [expanded, setExpanded] = useState(true);
  const [showDeductionTips, setShowDeductionTips] = useState(false);
  const [incomeInput, setIncomeInput] = useState(totalIncome || 100000);

  // Calculate tax estimates
  const taxEstimates = useMemo(() => {
    const netIncome = incomeInput - totalExpenses;
    
    if (region === 'CA') {
      // Canadian tax calculation
      let federalTax = 0;
      let remainingIncome = netIncome;
      
      for (const bracket of CANADA_TAX_BRACKETS.federal) {
        if (remainingIncome <= 0) break;
        const taxableInBracket = Math.min(remainingIncome, bracket.max - bracket.min);
        federalTax += taxableInBracket * (bracket.rate / 100);
        remainingIncome -= taxableInBracket;
      }
      
      const provincialTax = netIncome * (CANADA_TAX_BRACKETS.provincial.rate / 100);
      const cppContribution = Math.min(netIncome * (CANADA_TAX_BRACKETS.cpp / 100), 3867.50); // 2026 max
      const totalTax = federalTax + provincialTax + cppContribution;
      
      const hstCollected = incomeInput * (CANADA_TAX_BRACKETS.hstRate / 100);
      const hstPaid = totalExpenses * (CANADA_TAX_BRACKETS.hstRate / 100) * 0.7; // Estimate 70% of expenses have HST
      const hstOwing = hstCollected - hstPaid;
      
      return {
        grossIncome: incomeInput,
        deductions: totalExpenses,
        netIncome,
        federalTax,
        provincialTax,
        cppContribution,
        totalTax,
        effectiveRate: netIncome > 0 ? (totalTax / netIncome) * 100 : 0,
        recommendedSetAside: totalTax + hstOwing,
        setAsidePercentage: incomeInput > 0 ? ((totalTax + hstOwing) / incomeInput) * 100 : 0,
        hstCollected,
        hstPaid,
        hstOwing,
        quarterlyPayment: (totalTax + hstOwing) / 4
      };
    } else {
      // US tax calculation
      let federalTax = 0;
      let remainingIncome = netIncome;
      
      for (const bracket of US_TAX_BRACKETS.federal) {
        if (remainingIncome <= 0) break;
        const taxableInBracket = Math.min(remainingIncome, bracket.max - bracket.min);
        federalTax += taxableInBracket * (bracket.rate / 100);
        remainingIncome -= taxableInBracket;
      }
      
      const selfEmploymentTax = netIncome * (US_TAX_BRACKETS.selfEmploymentTax / 100);
      const stateTax = netIncome * (US_TAX_BRACKETS.avgStateRate / 100);
      const totalTax = federalTax + selfEmploymentTax + stateTax;
      
      return {
        grossIncome: incomeInput,
        deductions: totalExpenses,
        netIncome,
        federalTax,
        selfEmploymentTax,
        stateTax,
        totalTax,
        effectiveRate: netIncome > 0 ? (totalTax / netIncome) * 100 : 0,
        recommendedSetAside: totalTax,
        setAsidePercentage: incomeInput > 0 ? (totalTax / incomeInput) * 100 : 0,
        quarterlyPayment: totalTax / 4
      };
    }
  }, [incomeInput, totalExpenses, region]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-CA', { 
      style: 'currency', 
      currency: region === 'CA' ? 'CAD' : 'USD',
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  // Quarterly payment dates
  const getQuarterlyDates = () => {
    if (region === 'CA') {
      return ['Mar 15', 'Jun 15', 'Sep 15', 'Dec 15'];
    }
    return ['Apr 15', 'Jun 15', 'Sep 15', 'Jan 15'];
  };

  return (
    <div className="bg-gradient-to-br from-charcoal-800 to-charcoal-800/50 rounded-2xl border border-charcoal-700 overflow-hidden" data-testid="tax-advisor">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-charcoal-700/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-success/20 to-success/10 rounded-xl flex items-center justify-center">
            <PiggyBank className="w-5 h-5 text-success" />
          </div>
          <div className="text-left">
            <h3 className="text-lg font-semibold text-white">Tax Savings Advisor</h3>
            <p className="text-gray-400 text-sm">Know what to set aside for taxes</p>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
      </button>

      {expanded && (
        <div className="p-4 pt-0 space-y-4">
          {/* Income Input */}
          <div className="bg-charcoal-700/50 rounded-xl p-4">
            <label className="block text-sm text-gray-400 mb-2">Estimated Annual Revenue</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="number"
                value={incomeInput}
                onChange={(e) => setIncomeInput(Number(e.target.value) || 0)}
                className="w-full bg-charcoal-600 border border-charcoal-500 rounded-lg pl-10 pr-4 py-3 text-white text-lg font-semibold focus:border-steel-500"
                placeholder="100000"
              />
            </div>
          </div>

          {/* Main Recommendation */}
          <div className="bg-gradient-to-r from-success/20 to-success/5 rounded-xl p-5 border border-success/30">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-success/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Percent className="w-6 h-6 text-success" />
              </div>
              <div className="flex-1">
                <p className="text-gray-300 text-sm mb-1">Recommended Tax Set-Aside</p>
                <p className="text-3xl font-bold text-white mb-1">
                  {taxEstimates.setAsidePercentage.toFixed(0)}% <span className="text-lg text-gray-400">of revenue</span>
                </p>
                <p className="text-success font-semibold text-lg">
                  {formatCurrency(taxEstimates.recommendedSetAside)} per year
                </p>
              </div>
            </div>
          </div>

          {/* Breakdown */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-charcoal-700/50 rounded-xl p-4">
              <p className="text-gray-400 text-sm mb-1">Net Taxable Income</p>
              <p className="text-xl font-bold text-white">{formatCurrency(taxEstimates.netIncome)}</p>
              <p className="text-gray-500 text-xs mt-1">After {formatCurrency(taxEstimates.deductions)} deductions</p>
            </div>
            <div className="bg-charcoal-700/50 rounded-xl p-4">
              <p className="text-gray-400 text-sm mb-1">Effective Tax Rate</p>
              <p className="text-xl font-bold text-white">{taxEstimates.effectiveRate.toFixed(1)}%</p>
              <p className="text-gray-500 text-xs mt-1">On net income</p>
            </div>
          </div>

          {/* Tax Breakdown */}
          <div className="bg-charcoal-700/30 rounded-xl p-4">
            <p className="text-white font-medium mb-3">Tax Breakdown</p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Federal Tax</span>
                <span className="text-white">{formatCurrency(taxEstimates.federalTax)}</span>
              </div>
              {region === 'CA' ? (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Provincial Tax</span>
                    <span className="text-white">{formatCurrency(taxEstimates.provincialTax)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">CPP Contribution</span>
                    <span className="text-white">{formatCurrency(taxEstimates.cppContribution)}</span>
                  </div>
                  <div className="flex justify-between text-sm border-t border-charcoal-600 pt-2 mt-2">
                    <span className="text-gray-400">HST Owing (estimated)</span>
                    <span className="text-warning">{formatCurrency(taxEstimates.hstOwing)}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Self-Employment Tax</span>
                    <span className="text-white">{formatCurrency(taxEstimates.selfEmploymentTax)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">State Tax (avg)</span>
                    <span className="text-white">{formatCurrency(taxEstimates.stateTax)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between text-sm border-t border-charcoal-600 pt-2 mt-2 font-semibold">
                <span className="text-white">Total to Set Aside</span>
                <span className="text-success">{formatCurrency(taxEstimates.recommendedSetAside)}</span>
              </div>
            </div>
          </div>

          {/* Quarterly Payments */}
          <div className="bg-charcoal-700/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-steel-400" />
              <p className="text-white font-medium">Quarterly Installments</p>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {getQuarterlyDates().map((date, i) => (
                <div key={i} className="bg-charcoal-600/50 rounded-lg p-2 text-center">
                  <p className="text-gray-400 text-xs mb-1">{date}</p>
                  <p className="text-white font-semibold text-sm">{formatCurrency(taxEstimates.quarterlyPayment)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Deduction Tips Toggle */}
          <button
            onClick={() => setShowDeductionTips(!showDeductionTips)}
            className="w-full flex items-center justify-between bg-charcoal-700/30 hover:bg-charcoal-700/50 rounded-xl p-4 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-warning" />
              <span className="text-white font-medium">Deduction Tips by Category</span>
            </div>
            {showDeductionTips ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
          </button>

          {showDeductionTips && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {Object.entries(DEDUCTION_TIPS).map(([category, info]) => (
                <div key={category} className="bg-charcoal-700/30 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white font-medium text-sm">{category}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      info.percentage === 100 ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'
                    }`}>
                      {info.percentage}% deductible
                    </span>
                  </div>
                  <p className="text-gray-400 text-xs mb-1">{info.tip}</p>
                  <p className="text-gray-500 text-xs italic">e.g., {info.example}</p>
                </div>
              ))}
            </div>
          )}

          {/* Disclaimer */}
          <div className="flex items-start gap-2 text-xs text-gray-500 bg-charcoal-700/20 rounded-lg p-3">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>
              These are estimates based on general tax brackets. Actual taxes may vary based on your specific situation, 
              deductions, and credits. Consult a qualified accountant for personalized tax advice.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaxAdvisor;

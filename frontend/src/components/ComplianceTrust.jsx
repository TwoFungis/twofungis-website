import React from 'react';
import { Shield, CheckCircle2, MapPin, HardHat, FileCheck } from 'lucide-react';

const ComplianceTrust = () => {
  const items = [
    { icon: Shield, text: 'WorkSafe BC Compliant' },
    { icon: FileCheck, text: 'Fully Insured — $5M Liability' },
    { icon: HardHat, text: 'Safety-Conscious Site Practices' },
    { icon: CheckCircle2, text: 'Commercial & Multi-Family Coordination' },
    { icon: MapPin, text: 'Regional Coverage: Coastal BC, Vancouver Island, Okanagan' }
  ];

  return (
    <section id="compliance" className="py-16 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-wrap justify-center gap-6">
            {items.map((item, index) => {
              const IconComponent = item.icon;
              return (
                <div
                  key={index}
                  className="flex items-center gap-3 px-5 py-3 bg-white rounded-lg shadow-sm border border-gray-200"
                >
                  <IconComponent size={20} style={{ color: '#228B22' }} />
                  <span className="text-gray-700 font-medium text-sm" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                    {item.text}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ComplianceTrust;

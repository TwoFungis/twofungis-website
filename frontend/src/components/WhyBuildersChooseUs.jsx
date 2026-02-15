import React from 'react';
import { CheckCircle2 } from 'lucide-react';

const WhyBuildersChooseUs = () => {
  const reasons = [
    'Experienced in multi-phase and sequenced installations',
    'Clear communication with site supers and project managers',
    'Insured & WorkSafe compliant',
    'Regionally mobile across Coastal BC & Okanagan',
    'Detail-focused finishing with commercial reliability',
    'Consistent crew quality and performance standards'
  ];

  return (
    <section id="why-builders" className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="text-4xl sm:text-5xl font-bold text-black mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
              Why Builders <span className="text-red-600">Choose Us</span>
            </h2>
            <div className="w-24 h-1 bg-red-600 mx-auto"></div>
          </div>

          {/* Reasons List */}
          <div className="grid sm:grid-cols-2 gap-4">
            {reasons.map((reason, index) => (
              <div
                key={index}
                className="flex items-start p-4 bg-gray-50 rounded-lg"
              >
                <CheckCircle2 
                  className="flex-shrink-0 mr-3 mt-0.5" 
                  size={22} 
                  style={{ color: '#228B22' }} 
                />
                <span className="text-gray-700" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                  {reason}
                </span>
              </div>
            ))}
          </div>

          {/* Stats Bar */}
          <div className="mt-12 bg-black rounded-xl p-8">
            <div className="grid sm:grid-cols-3 gap-6 text-center">
              <div>
                <p className="text-4xl font-bold mb-1" style={{ fontFamily: 'Bebas Neue, sans-serif', color: '#228B22' }}>15+</p>
                <p className="text-white text-sm" style={{ fontFamily: 'Open Sans, sans-serif' }}>Years Combined Experience</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-red-600 mb-1" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>$5M</p>
                <p className="text-white text-sm" style={{ fontFamily: 'Open Sans, sans-serif' }}>Liability Coverage</p>
              </div>
              <div>
                <p className="text-4xl font-bold mb-1" style={{ fontFamily: 'Bebas Neue, sans-serif', color: '#228B22' }}>3</p>
                <p className="text-white text-sm" style={{ fontFamily: 'Open Sans, sans-serif' }}>Regions Served</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyBuildersChooseUs;

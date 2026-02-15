import React from 'react';
import { CheckCircle2 } from 'lucide-react';

const BuiltForBuilders = () => {
  const points = [
    'Experienced in multi-phase and sequenced finishing installations',
    'Direct coordination with project managers and site supervisors',
    'Structured scheduling and manpower allocation',
    'Insured and WorkSafe compliant',
    'Regionally mobile finishing crews',
    'Detail-driven execution with commercial reliability'
  ];

  return (
    <section id="for-builders" className="py-16 bg-black">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
              Built for <span className="text-red-600">Builders.</span>
            </h2>
            <div className="w-24 h-1 bg-red-600 mx-auto"></div>
          </div>

          {/* Points Grid */}
          <div className="grid sm:grid-cols-2 gap-4">
            {points.map((point, index) => (
              <div
                key={index}
                className="flex items-start p-4 rounded-lg"
                style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
              >
                <CheckCircle2 
                  className="flex-shrink-0 mr-3 mt-0.5" 
                  size={20} 
                  style={{ color: '#228B22' }} 
                />
                <span className="text-gray-300" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                  {point}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default BuiltForBuilders;

import React from 'react';
import { MapPin } from 'lucide-react';

const RegionalCoverage = () => {
  const regions = [
    {
      name: 'Coastal BC',
      areas: 'Vancouver, Burnaby, Surrey, Richmond, Coquitlam, New Westminster'
    },
    {
      name: 'Vancouver Island',
      areas: 'Victoria, Nanaimo, Courtenay, Duncan, Campbell River'
    },
    {
      name: 'Okanagan Region',
      areas: 'Kelowna, Penticton, Vernon, West Kelowna, Summerland, Lake Country'
    }
  ];

  return (
    <section id="coverage" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="text-4xl sm:text-5xl font-bold text-black mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
              Regional <span className="text-red-600">Coverage</span>
            </h2>
            <div className="w-24 h-1 bg-red-600 mx-auto mb-6"></div>
            <p className="text-lg text-gray-600" style={{ fontFamily: 'Open Sans, sans-serif' }}>
              Supporting builders across British Columbia's key markets
            </p>
          </div>

          {/* Regions */}
          <div className="grid md:grid-cols-3 gap-6">
            {regions.map((region, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-lg border-t-4 border-red-600 text-center"
              >
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#228B22' }}>
                  <MapPin className="text-white" size={24} />
                </div>
                <h3 className="text-xl font-bold text-black mb-2" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                  {region.name}
                </h3>
                <p className="text-gray-600 text-sm" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                  {region.areas}
                </p>
              </div>
            ))}
          </div>

          <p className="text-center text-gray-500 mt-8 text-sm" style={{ fontFamily: 'Open Sans, sans-serif' }}>
            Regionally mobile crews available for projects across all service areas
          </p>
        </div>
      </div>
    </section>
  );
};

export default RegionalCoverage;

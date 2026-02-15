import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ArrowRight } from 'lucide-react';
import { locations } from '../data/locations';

const RegionalCoverage = () => {
  const regionOrder = [
    'Okanagan Valley',
    'Thompson-Okanagan',
    'Thompson-Nicola',
    'Fraser Valley',
    'Coastal BC',
    'Vancouver Island'
  ];

  const [activeRegion, setActiveRegion] = useState('Okanagan Valley');

  // Group locations by region
  const groupedLocations = locations.reduce((acc, location) => {
    if (!acc[location.region]) {
      acc[location.region] = [];
    }
    acc[location.region].push(location);
    return acc;
  }, {});

  const activeLocations = groupedLocations[activeRegion] || [];

  return (
    <section id="coverage" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <h2 className="text-4xl sm:text-5xl font-bold text-black mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
              Regional <span className="text-red-600">Coverage</span>
            </h2>
            <div className="w-24 h-1 bg-red-600 mx-auto mb-6"></div>
            <p className="text-lg text-gray-600" style={{ fontFamily: 'Open Sans, sans-serif' }}>
              Supporting builders across British Columbia's key markets
            </p>
          </div>

          {/* Region Tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {regionOrder.map((region) => (
              <button
                key={region}
                onClick={() => setActiveRegion(region)}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition-all duration-300 ${
                  activeRegion === region
                    ? 'bg-red-600 text-white'
                    : 'bg-white text-black hover:bg-gray-200 border border-gray-300'
                }`}
                style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.5px' }}
              >
                {region.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Active Region Header */}
          <div className="mb-6 text-center">
            <h3 className="text-2xl font-bold text-black flex items-center justify-center" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
              <MapPin className="text-red-600 mr-2" size={24} />
              {activeRegion}
            </h3>
          </div>
          
          {/* Locations Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeLocations.map((location) => (
              <Link key={location.slug} to={`/locations/${location.slug}`}>
                <div className="bg-white p-5 rounded-lg border-l-4 border-red-600 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 h-full">
                  <h4 className="text-xl font-bold text-black mb-2" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                    {location.city}
                  </h4>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                    {location.description}
                  </p>
                  <div className="flex items-center font-semibold text-sm" style={{ color: '#228B22' }}>
                    <span style={{ fontFamily: 'Open Sans, sans-serif' }}>View Details</span>
                    <ArrowRight size={16} className="ml-1" />
                  </div>
                </div>
              </Link>
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

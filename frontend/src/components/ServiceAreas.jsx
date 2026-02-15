import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ArrowRight } from 'lucide-react';
import { Card } from './ui/card';
import { locations } from '../data/locations';

const ServiceAreas = () => {
  const regions = [
    'Coastal BC',
    'Vancouver Island',
    'Okanagan Valley',
    'Fraser Valley',
    'Thompson-Okanagan',
    'Thompson-Nicola'
  ];

  const [activeRegion, setActiveRegion] = useState('Coastal BC');

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
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="text-4xl sm:text-5xl font-bold text-black mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
              Service <span className="text-red-600">Areas</span>
            </h2>
            <div className="w-24 h-1 bg-red-600 mx-auto mb-6"></div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto" style={{ fontFamily: 'Open Sans, sans-serif' }}>
              Proudly serving communities across British Columbia
            </p>
          </div>

          {/* Region Tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {regions.map((region) => (
              <button
                key={region}
                onClick={() => setActiveRegion(region)}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition-all duration-300 ${
                  activeRegion === region
                    ? 'bg-red-600 text-white'
                    : 'bg-white text-black hover:bg-gray-200 border border-gray-300'
                }`}
                style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.5px' }}
                data-testid={`region-tab-${region.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {region.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Active Region Header */}
          <div className="mb-8">
            <h3 className="text-3xl font-bold text-black flex items-center justify-center" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
              <MapPin className="text-red-600 mr-3" size={32} />
              {activeRegion}
            </h3>
          </div>
          
          {/* Locations Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeLocations.map((location) => (
              <Link key={location.slug} to={`/locations/${location.slug}`}>
                <Card className="p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white border-l-4 border-red-600 h-full">
                  <h4 className="text-2xl font-bold text-black mb-3" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                    {location.city}
                  </h4>
                  <p className="text-gray-600 mb-4 text-sm" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                    {location.description.substring(0, 100)}...
                  </p>
                  <div className="flex items-center font-semibold" style={{ color: '#228B22' }}>
                    <span style={{ fontFamily: 'Open Sans, sans-serif' }}>Learn More</span>
                    <ArrowRight size={18} className="ml-2" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>

          {activeLocations.length === 0 && (
            <p className="text-center text-gray-500 py-8">No locations available in this region yet.</p>
          )}
        </div>
      </div>
    </section>
  );
};

export default ServiceAreas;

import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ArrowRight } from 'lucide-react';
import { Card } from './ui/card';
import { locations } from '../data/locations';

const ServiceAreas = () => {
  // Group locations by region
  const groupedLocations = locations.reduce((acc, location) => {
    if (!acc[location.region]) {
      acc[location.region] = [];
    }
    acc[location.region].push(location);
    return acc;
  }, {});

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-black mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
              Service <span className="text-red-600">Areas</span>
            </h2>
            <div className="w-24 h-1 bg-red-600 mx-auto mb-6"></div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto" style={{ fontFamily: 'Open Sans, sans-serif' }}>
              Proudly serving communities across Coastal BC, Vancouver Island, and the Okanagan Valley
            </p>
          </div>

          {/* Locations by Region */}
          {Object.entries(groupedLocations).map(([region, regionLocations]) => (
            <div key={region} className="mb-12">
              <h3 className="text-3xl font-bold text-black mb-6 flex items-center" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                <MapPin className="text-red-600 mr-3" size={32} />
                {region}
              </h3>
              
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {regionLocations.map((location) => (
                  <Link key={location.slug} to={`/locations/${location.slug}`}>
                    <Card className="p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white border-l-4 border-red-600 h-full">
                      <h4 className="text-2xl font-bold text-black mb-3" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                        {location.city}
                      </h4>
                      <p className="text-gray-600 mb-4 text-sm" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                        {location.description.substring(0, 100)}...
                      </p>
                      <div className="flex items-center text-red-600 font-semibold hover:text-red-700">
                        <span style={{ fontFamily: 'Open Sans, sans-serif' }}>Learn More</span>
                        <ArrowRight size={18} className="ml-2" />
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServiceAreas;

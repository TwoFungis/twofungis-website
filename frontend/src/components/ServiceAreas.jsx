import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
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

  // Track which regions are expanded — all collapsed by default
  const [expandedRegions, setExpandedRegions] = useState({});

  const toggleRegion = (region) => {
    setExpandedRegions((prev) => ({
      ...prev,
      [region]: !prev[region],
    }));
  };

  return (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="flex flex-col items-center justify-center gap-3 mb-4">
              <img src="https://customer-assets.emergentagent.com/job_okanagan-interiors/artifacts/x3dcmfph_image%20%281%29.png" alt="Two Fungis Finishing" className="h-20 md:h-24 w-auto" />
              <h2 className="text-4xl sm:text-5xl font-bold text-black" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                Service <span className="text-red-600">Areas</span>
              </h2>
            </div>
            <div className="w-24 h-1 bg-red-600 mx-auto mb-6"></div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto" style={{ fontFamily: 'Open Sans, sans-serif' }}>
              Proudly serving the entire Okanagan — Penticton, Kelowna, West Kelowna, Summerland and beyond
            </p>
          </div>

          {/* Collapsible Regions */}
          <div className="space-y-4">
            {Object.entries(groupedLocations).map(([region, regionLocations]) => {
              const isExpanded = !!expandedRegions[region];
              return (
                <div key={region} className="bg-white rounded-lg shadow-md overflow-hidden border-l-4 border-red-600">
                  <button
                    type="button"
                    onClick={() => toggleRegion(region)}
                    aria-expanded={isExpanded}
                    data-testid={`region-toggle-${region.replace(/\s+/g, '-').toLowerCase()}`}
                    className="w-full flex items-center justify-between px-6 py-5 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center">
                      <MapPin className="text-red-600 mr-3" size={28} />
                      <h3 className="text-2xl sm:text-3xl font-bold text-black text-left" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                        {region}
                      </h3>
                      <span className="ml-3 text-sm text-gray-500" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                        ({regionLocations.length} {regionLocations.length === 1 ? 'location' : 'locations'})
                      </span>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="text-gray-600" size={24} />
                    ) : (
                      <ChevronDown className="text-gray-600" size={24} />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="px-6 pb-6 pt-2">
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {regionLocations.map((location) => (
                          <Link key={location.slug} to={`/locations/${location.slug}`}>
                            <Card className="p-5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white border-l-4 border-red-600 h-full">
                              <h4 className="text-xl font-bold text-black mb-2" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                                {location.city}
                              </h4>
                              <p className="text-gray-600 mb-3 text-sm" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                                {location.description.substring(0, 90)}...
                              </p>
                              <div className="flex items-center font-semibold text-sm" style={{ color: '#228B22' }}>
                                <span style={{ fontFamily: 'Open Sans, sans-serif' }}>Learn More</span>
                                <ArrowRight size={16} className="ml-2" />
                              </div>
                            </Card>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ServiceAreas;

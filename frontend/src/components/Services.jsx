import React from 'react';
import { Home, Building2, Blocks, Building } from 'lucide-react';
import { Card } from './ui/card';

const Services = () => {
  const services = [
    {
      icon: Home,
      title: 'Residential Finishing',
      description: 'Transform your home with expert interior finishing. From elegant trim work to custom millwork, we bring your vision to life with precision and care.',
      features: ['Custom millwork', 'Trim & molding', 'Flooring installation', 'Interior doors & hardware']
    },
    {
      icon: Building2,
      title: 'Commercial Millwork',
      description: 'Elevate your commercial space with professional-grade millwork solutions. We deliver quality craftsmanship that meets the demands of any business environment.',
      features: ['Custom cabinetry', 'Reception desks', 'Shelving systems', 'Architectural millwork']
    },
    {
      icon: Blocks,
      title: 'Multi-Unit Residential',
      description: 'Specialized in finishing multi-unit developments with efficiency and consistency. We understand the unique requirements of large-scale residential projects.',
      features: ['Unit finishing packages', 'Common area millwork', 'Bulk installations', 'Timeline management']
    },
    {
      icon: Building,
      title: 'High-Rise Projects',
      description: 'Expert interior finishing for high-rise commercial and residential buildings. We handle complex logistics and deliver exceptional results at any elevation.',
      features: ['Lobby & entrance finishing', 'Corridor installations', 'Suite interiors', 'Coordinated scheduling']
    }
  ];

  return (
    <section id="services" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-black mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
              Our <span className="text-red-600">Services</span>
            </h2>
            <div className="w-24 h-1 bg-red-600 mx-auto mb-6"></div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto" style={{ fontFamily: 'Open Sans, sans-serif' }}>
              Comprehensive interior finishing solutions tailored to your project needs
            </p>
          </div>

          {/* Services Grid */}
          <div className="grid md:grid-cols-2 gap-8">
            {services.map((service, index) => {
              const IconComponent = service.icon;
              return (
                <Card
                  key={index}
                  className="p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 bg-white border-l-4 border-red-600"
                >
                  <div className="bg-black w-16 h-16 rounded-lg flex items-center justify-center mb-6">
                    <IconComponent className="text-red-600" size={32} />
                  </div>
                  <h3 className="text-2xl font-bold text-black mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                    {service.title}
                  </h3>
                  <p className="text-gray-600 mb-6 leading-relaxed" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                    {service.description}
                  </p>
                  <ul className="space-y-2">
                    {service.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center text-gray-700">
                        <div className="w-1.5 h-1.5 bg-red-600 rounded-full mr-3"></div>
                        <span style={{ fontFamily: 'Open Sans, sans-serif' }}>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Services;
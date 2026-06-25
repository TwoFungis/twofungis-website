import React from 'react';
import { Hammer, Layers, DoorOpen, Building2, Building, ClipboardCheck, Wrench } from 'lucide-react';
import { Card } from './ui/card';

const Services = () => {
  const services = [
    {
      icon: Hammer,
      title: 'Finish Carpentry',
      description: 'Precision finish carpentry for commercial and multi-family projects across the Okanagan — baseboards, casing, crown, wainscoting, stairs, railings and custom built-ins.',
      features: ['Baseboards & casing', 'Crown molding', 'Stairs & railings', 'Wainscoting & paneling']
    },
    {
      icon: Layers,
      title: 'Architectural Millwork',
      description: 'Custom architectural millwork installation for developers, GCs and interior designers — feature walls, reception millwork, custom cabinetry and bespoke joinery.',
      features: ['Feature walls', 'Custom cabinetry', 'Reception millwork', 'Bespoke joinery']
    },
    {
      icon: DoorOpen,
      title: 'Doors & Hardware',
      description: 'Commercial and residential door & hardware packages — supply and install of interior, fire-rated and architectural doors with full hardware coordination.',
      features: ['Pre-hung & slab doors', 'Fire-rated doors', 'Hinges, locksets & closers', 'Hardware schedules']
    },
    {
      icon: Building2,
      title: 'Multi-Family Construction',
      description: 'Finishing packages for multi-family developments in Penticton, Kelowna and across the Okanagan — efficient scheduling, consistent quality, unit by unit.',
      features: ['Suite finishing packages', 'Common area millwork', 'Phased delivery', 'Schedule-driven crews']
    },
    {
      icon: Building,
      title: 'Commercial Interiors',
      description: 'Commercial finishing for offices, retail, hospitality and institutional builds — from tenant improvements to full architectural fit-outs.',
      features: ['Office & retail fit-outs', 'Hospitality interiors', 'Tenant improvements', 'Institutional projects']
    },
    {
      icon: ClipboardCheck,
      title: 'Deficiency Completion',
      description: 'Punch-list and deficiency completion services for GCs and developers — fast turnaround, documented closeout, and clean handover.',
      features: ['Punch-list completion', 'Warranty repairs', 'Documented closeout', 'Owner walkthrough']
    },
    {
      icon: Wrench,
      title: 'Tenant Improvements',
      description: 'Tenant improvement finishing across the Okanagan — bringing leased commercial space up to a finished, brand-aligned standard on tight timelines.',
      features: ['Demising & infill', 'Trim & millwork', 'Doors & hardware', 'Fast-track schedules']
    }
  ];

  return (
    <section id="services" className="py-12 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="flex flex-col items-center justify-center gap-3 mb-4">
              <img src="https://customer-assets.emergentagent.com/job_okanagan-interiors/artifacts/x3dcmfph_image%20%281%29.png" alt="Two Fungis Finishing" className="h-20 md:h-24 w-auto" />
              <h2 className="text-4xl sm:text-5xl font-bold text-black" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                Our <span className="text-red-600">Services</span>
              </h2>
            </div>
            <div className="w-24 h-1 bg-red-600 mx-auto mb-6"></div>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto" style={{ fontFamily: 'Open Sans, sans-serif' }}>
              Finish carpentry, architectural millwork, doors &amp; hardware, multi-family, commercial interiors, deficiency completion and tenant improvements — serving the entire Okanagan.
            </p>
          </div>

          {/* Services Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => {
              const IconComponent = service.icon;
              return (
                <Card
                  key={index}
                  className="p-6 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 bg-white border-l-4 border-red-600"
                  data-testid={`service-card-${index}`}
                >
                  <div className="w-14 h-14 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: '#228B22' }}>
                    <IconComponent className="text-white" size={28} />
                  </div>
                  <h3 className="text-2xl font-bold text-black mb-3" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                    {service.title}
                  </h3>
                  <p className="text-gray-600 mb-4 leading-relaxed text-sm" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                    {service.description}
                  </p>
                  <ul className="space-y-2">
                    {service.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center text-gray-700 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full mr-3 flex-shrink-0" style={{ backgroundColor: '#228B22' }}></div>
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

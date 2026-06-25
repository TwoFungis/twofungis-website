import React, { useState } from 'react';
import { Hammer, Layers, DoorOpen, Building2, Building, ClipboardCheck, Wrench, Briefcase, FileCheck2, ArrowRight } from 'lucide-react';
import { Card } from './ui/card';
import PrequalificationModal from './PrequalificationModal';

const Services = () => {
  const [prequalOpen, setPrequalOpen] = useState(false);
  const services = [
    {
      icon: Hammer,
      title: 'Commercial Finish Carpentry',
      description: 'Trim, casing, base, crown, stairs, handrails and built-ins for offices, retail, hospitality and institutional builds across British Columbia.',
      features: ['Standing &amp; running trim', 'Stairs &amp; handrails', 'Built-ins &amp; casework', 'Specialty installations']
    },
    {
      icon: Layers,
      title: 'Architectural Millwork',
      description: 'Shop-drawing coordination, supply and field installation of architectural millwork — feature walls, reception millwork, custom casework and bespoke joinery.',
      features: ['Shop-drawing coordination', 'Feature walls &amp; paneling', 'Reception &amp; transaction millwork', 'Custom casework']
    },
    {
      icon: DoorOpen,
      title: 'Doors & Hardware',
      description: 'Complete door and hardware packages — supply, hardware scheduling, fire-rated assemblies and field installation for commercial and institutional projects.',
      features: ['Hollow metal &amp; wood doors', 'Fire-rated assemblies', 'Hardware schedules &amp; supply', 'Field installation']
    },
    {
      icon: Building2,
      title: 'Multi-Family Construction',
      description: 'Suite-by-suite finishing packages for multifamily developments — phased crews, consistent quality, schedule-driven delivery for high-volume projects.',
      features: ['Suite finishing packages', 'Common-area millwork', 'Phased delivery', 'High-volume coordination']
    },
    {
      icon: Building,
      title: 'Commercial Interiors',
      description: 'Office, retail, hospitality and institutional fit-outs — from base building handover through to substantial completion.',
      features: ['Office &amp; retail fit-outs', 'Hospitality &amp; F&amp;B', 'Institutional projects', 'Base-build to TI handover']
    },
    {
      icon: Wrench,
      title: 'Tenant Improvements',
      description: 'Fast-track tenant improvement finishing — demising, trim, millwork, doors and hardware delivered to tight commercial schedules.',
      features: ['Demising &amp; infill', 'Trim &amp; millwork', 'Doors &amp; hardware', 'Fast-track schedules']
    },
    {
      icon: ClipboardCheck,
      title: 'Deficiency Completion',
      description: 'Punch-list and deficiency completion services for developers and GCs — clean documentation, fast turnaround, and a well-managed handover.',
      features: ['Punch-list completion', 'Warranty repairs', 'Documented closeout', 'Owner walkthrough support']
    },
    {
      icon: Briefcase,
      title: 'Construction Support',
      description: 'Pre-construction reviews, tender support, scope coordination and on-site problem solving — embedded in the GC and developer\u2019s schedule.',
      features: ['Pre-construction &amp; tender review', 'Scope &amp; inclusion review', 'Site coordination', 'Schedule integration']
    }
  ];

  const industries = [
    'Multi-Family Residential', 'Commercial', 'Institutional', 'Schools',
    'Healthcare', 'Hospitality', 'Mixed-Use', 'Senior Living',
    'Tenant Improvements', 'Custom Residential'
  ];

  return (
    <section id="services" className="py-12 bg-gray-50 scroll-mt-32">
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
            <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto" style={{ fontFamily: 'Open Sans, sans-serif' }}>
              Serving commercial, multifamily, institutional and select residential projects throughout British Columbia.
            </p>
          </div>

          {/* Services Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {services.map((service, index) => {
              const IconComponent = service.icon;
              return (
                <Card
                  key={index}
                  className="p-6 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 bg-white border-l-4 border-red-600"
                  data-testid={`service-card-${index}`}
                >
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: '#228B22' }}>
                    <IconComponent className="text-white" size={24} />
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
                        <span style={{ fontFamily: 'Open Sans, sans-serif' }} dangerouslySetInnerHTML={{ __html: feature }} />
                      </li>
                    ))}
                  </ul>
                </Card>
              );
            })}
          </div>

          {/* Industries Strip */}
          <div className="border-t border-gray-200 pt-10 mb-16">
            <h3 className="text-xs uppercase tracking-[0.2em] text-gray-500 text-center mb-4" style={{ fontFamily: 'Open Sans, sans-serif' }}>
              Industries We Serve
            </h3>
            <div className="flex flex-wrap justify-center gap-2 max-w-4xl mx-auto">
              {industries.map((ind) => (
                <span key={ind} className="px-3 py-1 rounded-full text-sm text-gray-700 bg-white border border-gray-200" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                  {ind}
                </span>
              ))}
            </div>
          </div>

          {/* Subcontractor Prequalification — procurement-ready resource section */}
          <section
            id="prequalification"
            className="rounded-xl p-8 sm:p-12 shadow-2xl scroll-mt-32"
            style={{ backgroundColor: '#0f0f12' }}
            data-testid="prequal-section"
          >
            <div className="grid lg:grid-cols-3 gap-8 items-start">
              <div className="lg:col-span-1">
                <div className="w-14 h-14 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: '#228B22' }}>
                  <FileCheck2 className="text-white" size={28} />
                </div>
                <p className="text-xs uppercase tracking-[0.2em] mb-2" style={{ color: '#32CD32', fontFamily: 'Open Sans, sans-serif' }}>
                  For Procurement &amp; GCs
                </p>
                <h3 className="text-3xl sm:text-4xl font-bold text-white mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                  Subcontractor Prequalification
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed mb-6" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                  Two Fungis Finishing maintains a current Subcontractor Prequalification Package for General Contractors, Developers, Construction Managers, Procurement Teams, and Property Managers.
                </p>
                <button
                  type="button"
                  onClick={() => setPrequalOpen(true)}
                  className="inline-flex items-center gap-2 text-white px-6 py-3 rounded-md text-sm font-semibold transition-colors"
                  style={{ backgroundColor: '#228B22' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor='#1e7b1e'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor='#228B22'}
                  data-testid="services-prequal-btn"
                >
                  Request Prequalification Package <ArrowRight size={16} />
                </button>
              </div>

              <div className="lg:col-span-2">
                <p className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-3" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                  Package Includes
                </p>
                <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2 mb-6" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                  {[
                    'Corporate Information',
                    'WorkSafeBC Status',
                    'Commercial General Liability',
                    'Financial Qualifications',
                    'Quality Management',
                    'Staffing &amp; Equipment',
                    'Project Experience',
                    'Construction Systems',
                    'References (Available Upon Request)',
                  ].map((item) => (
                    <li key={item} className="flex items-start text-gray-200 text-sm">
                      <span className="inline-block w-1.5 h-1.5 rounded-full mt-2 mr-3 flex-shrink-0" style={{ backgroundColor: '#228B22' }}></span>
                      <span dangerouslySetInnerHTML={{ __html: item }} />
                    </li>
                  ))}
                </ul>
                <p className="text-gray-400 text-xs italic leading-relaxed" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                  To ensure our information remains accurate and current, our latest prequalification package is provided directly upon request rather than publicly downloaded.
                </p>

                {/* Future expansion slot — additional downloadable resources can be added here */}
                {/*
                <div className="mt-8 pt-6 border-t border-white/10">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-3">Additional Resources</p>
                  <div className="grid sm:grid-cols-2 gap-2 text-sm">
                    Add: Capability Statement, Insurance Certificate, Bonding Letter,
                    WorkSafeBC Clearance, Safety Documentation, Project Portfolio
                  </div>
                </div>
                */}
              </div>
            </div>
          </section>
        </div>
      </div>

      <PrequalificationModal open={prequalOpen} onClose={() => setPrequalOpen(false)} />
    </section>
  );
};

export default Services;

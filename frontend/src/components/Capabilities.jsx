import React from 'react';
import { 
  DoorOpen, 
  Hammer, 
  LayoutGrid, 
  Building2, 
  Building, 
  Wrench,
  ClipboardCheck,
  Layers
} from 'lucide-react';

const Capabilities = () => {
  const capabilities = [
    { icon: LayoutGrid, title: 'Interior Trim Packages' },
    { icon: DoorOpen, title: 'Door & Hardware Installation' },
    { icon: Hammer, title: 'Base & Casing' },
    { icon: Layers, title: 'Millwork & Cabinet Installation' },
    { icon: Building2, title: 'Multi-Family Finishing' },
    { icon: Building, title: 'High-Rise Unit Turnovers' },
    { icon: Wrench, title: 'Commercial Tenant Improvements' },
    { icon: ClipboardCheck, title: 'Punch List Completion' }
  ];

  return (
    <section id="capabilities" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="text-4xl sm:text-5xl font-bold text-black mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
              Our <span className="text-red-600">Capabilities</span>
            </h2>
            <div className="w-24 h-1 bg-red-600 mx-auto mb-6"></div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto" style={{ fontFamily: 'Open Sans, sans-serif' }}>
              Comprehensive finishing services designed for scale and coordination
            </p>
          </div>

          {/* Capabilities Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {capabilities.map((item, index) => {
              const IconComponent = item.icon;
              return (
                <div
                  key={index}
                  className="bg-white p-6 rounded-lg border-l-4 border-red-600 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: '#228B22' }}>
                    <IconComponent className="text-white" size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-black" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                    {item.title}
                  </h3>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Capabilities;

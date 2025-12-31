import React from 'react';
import { CheckCircle2, Clock, Target, Wrench } from 'lucide-react';

const WhyChooseUs = () => {
  const reasons = [
    {
      icon: CheckCircle2,
      title: 'Proven Expertise',
      description: 'Years of successful projects across residential and commercial sectors'
    },
    {
      icon: Target,
      title: 'Precision Craftsmanship',
      description: 'Meticulous attention to detail on every project, large or small'
    },
    {
      icon: Clock,
      title: 'Reliable Timeline',
      description: 'Committed to delivering projects on schedule without compromising quality'
    },
    {
      icon: Wrench,
      title: 'Full-Service Solutions',
      description: 'Comprehensive interior finishing services from concept to completion'
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-black mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
              Why Choose <span className="text-red-600">Two Fungis Ltd</span>
            </h2>
            <div className="w-24 h-1 bg-red-600 mx-auto mb-6"></div>
          </div>

          {/* Reasons Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {reasons.map((reason, index) => {
              const IconComponent = reason.icon;
              return (
                <div key={index} className="text-center">
                  <div className="bg-red-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 hover:scale-110 transition-transform duration-300">
                    <IconComponent className="text-white" size={36} />
                  </div>
                  <h3 className="text-xl font-bold text-black mb-3" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                    {reason.title}
                  </h3>
                  <p className="text-gray-600" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                    {reason.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Stats Section */}
          <div className="bg-black rounded-xl p-12">
            <div className="grid sm:grid-cols-3 gap-8 text-center">
              <div>
                <p className="text-5xl font-bold text-red-600 mb-2" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>25+</p>
                <p className="text-white text-lg" style={{ fontFamily: 'Open Sans, sans-serif' }}>Years Experience</p>
              </div>
              <div>
                <p className="text-5xl font-bold text-red-600 mb-2" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>$5M</p>
                <p className="text-white text-lg" style={{ fontFamily: 'Open Sans, sans-serif' }}>Liability Insurance</p>
              </div>
              <div>
                <p className="text-5xl font-bold text-red-600 mb-2" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>100%</p>
                <p className="text-white text-lg" style={{ fontFamily: 'Open Sans, sans-serif' }}>Quality Guarantee</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
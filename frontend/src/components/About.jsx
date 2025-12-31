import React from 'react';
import { Award, Users, TrendingUp, Shield } from 'lucide-react';
import { Card } from './ui/card';

const About = () => {
  const highlights = [
    {
      icon: Award,
      title: 'Since 2017',
      description: 'Years of excellence in interior finishing'
    },
    {
      icon: Shield,
      title: '$5M Coverage',
      description: 'Comprehensive liability insurance'
    },
    {
      icon: TrendingUp,
      title: 'Premium Quality',
      description: 'Uncompromising standards on every project'
    },
    {
      icon: Users,
      title: 'Expert Team',
      description: 'Skilled professionals dedicated to excellence'
    }
  ];

  return (
    <section id="about" className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-black mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
              About <span className="text-red-600">Two Fungis Ltd</span>
            </h2>
            <div className="w-24 h-1 bg-red-600 mx-auto mb-6"></div>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto" style={{ fontFamily: 'Open Sans, sans-serif' }}>
              We are a premier interior finishing company serving the Okanagan region, specializing in residential, commercial millwork, multi-unit residential, and high-rise commercial projects.
            </p>
          </div>

          {/* Story */}
          <div className="grid md:grid-cols-2 gap-12 mb-16 items-center">
            <div>
              <h3 className="text-3xl font-bold text-black mb-6" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                Our Story
              </h3>
              <p className="text-gray-700 mb-4 leading-relaxed" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                Established in 2017, Two Fungis Ltd has built a reputation for delivering exceptional interior finishing services across diverse project types. Our expertise spans from intimate residential spaces to expansive high-rise commercial developments.
              </p>
              <p className="text-gray-700 mb-4 leading-relaxed" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                After a brief hiatus to explore other ventures, we're returning stronger than ever with renewed commitment to excellence. With our $5 million liability insurance in place, we're ready to secure large-scale contracts throughout the Okanagan area.
              </p>
              <p className="text-gray-700 leading-relaxed" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                Our dedication to precision craftsmanship, innovative solutions, and client satisfaction sets us apart in the competitive world of interior finishing.
              </p>
            </div>
            <div className="relative">
              <img
                src="https://customer-assets.emergentagent.com/job_okanagan-interiors/artifacts/xy0jgjk8_IMG_20191217_163428.jpg"
                alt="Interior finishing work"
                className="rounded-lg shadow-2xl w-full h-auto object-cover"
              />
              <div className="absolute -bottom-6 -left-6 bg-red-600 text-white p-6 rounded-lg shadow-xl">
                <p className="text-4xl font-bold" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>8+</p>
                <p className="text-sm" style={{ fontFamily: 'Open Sans, sans-serif' }}>Years Experience</p>
              </div>
            </div>
          </div>

          {/* Highlights Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {highlights.map((item, index) => {
              const IconComponent = item.icon;
              return (
                <Card key={index} className="p-6 hover:shadow-xl transition-shadow duration-300 border-t-4 border-red-600">
                  <div className="bg-red-600/10 w-14 h-14 rounded-full flex items-center justify-center mb-4">
                    <IconComponent className="text-red-600" size={28} />
                  </div>
                  <h4 className="text-xl font-bold text-black mb-2" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                    {item.title}
                  </h4>
                  <p className="text-gray-600" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                    {item.description}
                  </p>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
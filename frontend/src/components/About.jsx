import React from 'react';
import { Award, Users, TrendingUp, Shield } from 'lucide-react';
import { Card } from './ui/card';

const About = () => {
  const highlights = [
    {
      icon: Award,
      title: '25+ Years Experience',
      description: 'Over two decades of hands-on expertise in millwork and finishing carpentry'
    },
    {
      icon: Shield,
      title: '$5M Coverage',
      description: 'Comprehensive liability insurance'
    },
    {
      icon: TrendingUp,
      title: 'Master Craftsmanship',
      description: 'Precision finishing, cabinet install, flooring, and machinist expertise'
    },
    {
      icon: Users,
      title: 'Expert Founders',
      description: 'Led by Scott Marshall & Beau Suprun - unparalleled industry expertise'
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
              We are a premier interior finishing company serving Coastal B.C and Vancouver Island regions, specializing in residential, commercial millwork, multi-unit residential, and high-rise commercial projects.
            </p>
          </div>

          {/* Story */}
          <div className="grid md:grid-cols-2 gap-12 mb-16 items-center">
            <div>
              <h3 className="text-3xl font-bold text-black mb-6" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                Our Story
              </h3>
              <p className="text-gray-700 mb-4 leading-relaxed" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                Established in 2017, Two Fungis Ltd brings over 25 years of combined hands-on expertise to every project. Founded by Scott Marshall and Beau Suprun, our company represents the perfect union of experience and precision craftsmanship.
              </p>
              <p className="text-gray-700 mb-4 leading-relaxed" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                Scott Marshall has built a distinguished career spanning 25 years in millwork, finishing carpentry, cabinet installation, and flooring. His expertise ensures exceptional craftsmanship across all project types.
              </p>
              <p className="text-gray-700 mb-4 leading-relaxed" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                Beau Suprun, master craftsman, exceptional carpenter, and machinist, brings an unparalleled eye for detail and perfection that is second to none in the finishing world. With extensive experience in multi-unit finishing management and installation, his meticulous approach guarantees flawless execution on every project.
              </p>
              <p className="text-gray-700 mb-4 leading-relaxed" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                With our $5 million liability insurance and proven track record, we continue to secure large-scale contracts throughout Coastal B.C and Vancouver Island. Our commitment to excellence and professional service has made us a trusted partner for projects of all sizes.
              </p>
              <p className="text-gray-700 leading-relaxed" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                Together, Scott and Beau lead a team dedicated to precision craftsmanship and innovative solutions. From intimate residential spaces to expansive high-rise commercial developments, our combined expertise ensures every detail is executed to perfection.
              </p>
            </div>
            <div className="relative">
              <img
                src="https://customer-assets.emergentagent.com/job_okanagan-interiors/artifacts/d422l0sp_20211103_163344.jpg"
                alt="Custom kitchen cabinetry and millwork"
                className="rounded-lg shadow-2xl w-full h-auto object-cover"
              />
              <div className="absolute -bottom-6 -left-6 text-white p-6 rounded-lg shadow-xl" style={{ backgroundColor: '#228B22' }}>
                <p className="text-4xl font-bold" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>25+</p>
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
                  <div className="bg-green-500/10 w-14 h-14 rounded-full flex items-center justify-center mb-4">
                    <IconComponent className="text-green-600" size={28} />
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
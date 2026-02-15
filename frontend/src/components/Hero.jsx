import React from 'react';
import { Button } from './ui/button';
import { ChevronRight } from 'lucide-react';

const Hero = () => {
  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">
      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <div className="max-w-4xl mx-auto">
          {/* Logo Image Above Title - 50% larger */}
          <div className="mb-8 flex justify-center">
            <img
              src="https://customer-assets.emergentagent.com/job_okanagan-interiors/artifacts/x3dcmfph_image%20%281%29.png"
              alt="Two Fungis Ltd"
              className="h-72 md:h-84 w-auto drop-shadow-2xl"
              style={{ height: 'clamp(18rem, 25vw, 21rem)' }}
            />
          </div>
          
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 animate-fade-in" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
            Premium Interior <span className="text-red-600">Finishing & Carpentry</span>
          </h1>
          <p className="text-xl sm:text-2xl text-gray-200 mb-8 max-w-2xl mx-auto" style={{ fontFamily: 'Open Sans, sans-serif' }}>
            Specializing in high end residential & commercial finishing, including high-rise & multi-family projects across Coastal B.C and Vancouver Island regions since 2017
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              onClick={() => scrollToSection('contact')}
              className="text-white px-8 py-6 text-lg font-semibold transition-all duration-200 hover:scale-105"
              style={{ backgroundColor: '#228B22', hover: { backgroundColor: '#1e7b1e' } }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#1e7b1e'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#228B22'}
            >
              Request a Quote
              <ChevronRight className="ml-2" size={20} />
            </Button>
            <Button
              onClick={() => scrollToSection('portfolio')}
              variant="outline"
              className="text-white px-8 py-6 text-lg font-semibold transition-all duration-200"
              style={{ borderColor: '#228B22', borderWidth: '2px' }}
              onMouseEnter={(e) => { e.target.style.backgroundColor = '#228B22'; e.target.style.color = 'black'; }}
              onMouseLeave={(e) => { e.target.style.backgroundColor = 'transparent'; e.target.style.color = 'white'; }}
            >
              View Our Work
            </Button>
          </div>
          
          {/* Trust Badge */}
          <div className="mt-12 inline-flex items-center gap-2 px-6 py-3 rounded-full" style={{ backgroundColor: 'rgba(34, 139, 34, 0.2)', borderColor: 'rgba(34, 139, 34, 0.5)', borderWidth: '1px', borderStyle: 'solid' }}>
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#228B22' }}></div>
            <span className="font-medium" style={{ color: '#32CD32' }}>$5M Liability Insurance</span>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center p-2">
          <div className="w-1 h-3 rounded-full" style={{ backgroundColor: '#228B22' }}></div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
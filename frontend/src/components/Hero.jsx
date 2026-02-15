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
          {/* Logo Image Above Title */}
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
          <p className="text-xl sm:text-2xl text-gray-200 mb-8 max-w-3xl mx-auto" style={{ fontFamily: 'Open Sans, sans-serif' }}>
            Trusted Finishing Subcontractor for Residential, Commercial, Multi-Family & High-Rise Builders Across Coastal BC & the Okanagan.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              onClick={() => scrollToSection('estimating')}
              className="text-white px-8 py-6 text-lg font-semibold transition-all duration-200 hover:scale-105"
              style={{ backgroundColor: '#228B22' }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#1e7b1e'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#228B22'}
              data-testid="request-estimating-btn"
            >
              Request Estimating
              <ChevronRight className="ml-2" size={20} />
            </Button>
            <Button
              onClick={() => scrollToSection('portfolio')}
              variant="outline"
              className="text-white px-8 py-6 text-lg font-semibold transition-all duration-200"
              style={{ borderColor: '#228B22', borderWidth: '2px' }}
              onMouseEnter={(e) => { e.target.style.backgroundColor = '#228B22'; e.target.style.color = 'black'; }}
              onMouseLeave={(e) => { e.target.style.backgroundColor = 'transparent'; e.target.style.color = 'white'; }}
              data-testid="view-work-btn"
            >
              View Our Work
            </Button>
          </div>
          
          {/* Trust Badges */}
          <div className="mt-12 flex flex-wrap justify-center gap-4">
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full" style={{ backgroundColor: 'rgba(34, 139, 34, 0.2)', border: '1px solid rgba(34, 139, 34, 0.5)' }}>
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#228B22' }}></div>
              <span className="font-medium text-sm" style={{ color: '#32CD32' }}>$5M Liability Insurance</span>
            </div>
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full" style={{ backgroundColor: 'rgba(34, 139, 34, 0.2)', border: '1px solid rgba(34, 139, 34, 0.5)' }}>
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#228B22' }}></div>
              <span className="font-medium text-sm" style={{ color: '#32CD32' }}>WorkSafe BC Compliant</span>
            </div>
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

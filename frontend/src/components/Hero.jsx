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
    <section id="home" className="relative min-h-screen flex items-center justify-center bg-black overflow-hidden">
      {/* Hero Image with Logo */}
      <div className="absolute inset-0">
        <img
          src="https://customer-assets.emergentagent.com/job_okanagan-interiors/artifacts/3hzaqj34_1606875705391.png"
          alt="Two Fungis Ltd"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40"></div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 animate-fade-in" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
            Premium Interior <span className="text-red-600">Finishing</span> Excellence
          </h1>
          <p className="text-xl sm:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto" style={{ fontFamily: 'Open Sans, sans-serif' }}>
            Specializing in residential, commercial millwork, and high-rise projects across Coastal B.C and Vancouver Island regions since 2017
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              onClick={() => scrollToSection('contact')}
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-6 text-lg font-semibold transition-all duration-200 hover:scale-105"
            >
              Request a Quote
              <ChevronRight className="ml-2" size={20} />
            </Button>
            <Button
              onClick={() => scrollToSection('portfolio')}
              variant="outline"
              className="border-2 border-white text-white hover:bg-white hover:text-black px-8 py-6 text-lg font-semibold transition-all duration-200"
            >
              View Our Work
            </Button>
          </div>
          
          {/* Trust Badge */}
          <div className="mt-12 inline-flex items-center gap-2 bg-green-600/20 border border-green-600/50 px-6 py-3 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-400 font-medium">$5M Liability Insurance</span>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center p-2">
          <div className="w-1 h-3 bg-red-600 rounded-full"></div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
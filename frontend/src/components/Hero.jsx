import React from 'react';
import { Button } from './ui/button';
import { ChevronRight, Phone } from 'lucide-react';

const Hero = () => {
  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black pt-28 sm:pt-32 md:pt-36 pb-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <div className="max-w-6xl mx-auto">
          {/* Marketing Logo */}
          <div className="mb-6 flex justify-center">
            <img
              src="https://customer-assets.emergentagent.com/job_find-twofungis/artifacts/afq4qky8_ChatGPT%20Image%20Jun%2017%2C%202026%2C%2012_03_36%20PM.png"
              alt="Two Fungis Finishing"
              className="w-full max-w-5xl h-auto drop-shadow-2xl"
            />
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
            Commercial &amp; Multifamily <span className="text-red-600">Interior Finishing</span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-200 mb-8 max-w-3xl mx-auto leading-relaxed" style={{ fontFamily: 'Open Sans, sans-serif' }}>
            Providing finish carpentry, architectural millwork, doors &amp; hardware, deficiency completion, and interior finishing services throughout British Columbia.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
            <Button
              onClick={() => scrollToSection('contact')}
              className="text-white px-8 py-6 text-base font-semibold inline-flex items-center"
              style={{ backgroundColor: '#228B22' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor='#1e7b1e'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor='#228B22'}
              data-testid="hero-tender-btn"
            >
              Request a Tender Invitation
              <ChevronRight size={18} className="ml-1" />
            </Button>
            <Button
              onClick={() => scrollToSection('contact')}
              variant="outline"
              className="text-white px-8 py-6 text-base font-semibold inline-flex items-center"
              style={{ borderColor: '#ffffff', borderWidth: '1px', backgroundColor: 'transparent' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; e.currentTarget.style.color = '#000000'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#ffffff'; }}
              data-testid="hero-consult-btn"
            >
              Request a Consultation
            </Button>
          </div>

          {/* Subtle service strip */}
          <p className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-8" style={{ fontFamily: 'Open Sans, sans-serif' }}>
            Finish Carpentry · Architectural Millwork · Doors &amp; Hardware · Multifamily · Commercial Interiors · Deficiency Completion
          </p>

          {/* Procore Badge */}
          <div className="flex justify-center">
            <a
              href="https://network.procore.com/p/two-fungis-ltd-penticton"
              target="_blank"
              rel="noopener noreferrer dofollow"
              className="bg-white p-3 rounded-lg shadow-2xl hover:scale-105 transition-transform"
              data-testid="procore-badge-top"
              aria-label="Two Fungis Finishing on the Procore Construction Network"
            >
              <img
                src="https://network.procore.com/assets/static/procore-black-badge.svg"
                alt="Procore Construction Network — Two Fungis Finishing"
                className="h-14 md:h-16 w-auto"
              />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

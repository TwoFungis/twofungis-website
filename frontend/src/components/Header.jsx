import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from './ui/button';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-black/95 backdrop-blur-sm shadow-lg' : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-24">
          {/* Logo */}
          <div className="flex-shrink-0">
            <img
              src="https://customer-assets.emergentagent.com/job_okanagan-interiors/artifacts/x3dcmfph_image%20%281%29.png"
              alt="Two Fungis Ltd"
              className="h-20 md:h-24 w-auto cursor-pointer"
              onClick={() => scrollToSection('home')}
            />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => scrollToSection('home')}
              className="text-white transition-colors duration-200 font-medium"
              onMouseEnter={(e) => e.target.style.color='#228B22'}
              onMouseLeave={(e) => e.target.style.color='white'}
            >
              Home
            </button>
            <button
              onClick={() => scrollToSection('about')}
              className="text-white transition-colors duration-200 font-medium"
              onMouseEnter={(e) => e.target.style.color='#228B22'}
              onMouseLeave={(e) => e.target.style.color='white'}
            >
              About
            </button>
            <button
              onClick={() => scrollToSection('services')}
              className="text-white transition-colors duration-200 font-medium"
              onMouseEnter={(e) => e.target.style.color='#228B22'}
              onMouseLeave={(e) => e.target.style.color='white'}
            >
              Services
            </button>
            <button
              onClick={() => scrollToSection('portfolio')}
              className="text-white transition-colors duration-200 font-medium"
              onMouseEnter={(e) => e.target.style.color='#228B22'}
              onMouseLeave={(e) => e.target.style.color='white'}
            >
              Portfolio
            </button>
            <button
              onClick={() => scrollToSection('contact')}
              className="text-white transition-colors duration-200 font-medium"
              onMouseEnter={(e) => e.target.style.color='#228B22'}
              onMouseLeave={(e) => e.target.style.color='white'}
            >
              Contact
            </button>
            <Button
              onClick={() => scrollToSection('contact')}
              className="text-white px-6 py-2 transition-colors duration-200"
              style={{ backgroundColor: '#228B22' }}
              onMouseEnter={(e) => e.target.style.backgroundColor='#1e7b1e'}
              onMouseLeave={(e) => e.target.style.backgroundColor='#228B22'}
            >
              Get a Quote
            </Button>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-white transition-colors"
            onMouseEnter={(e) => e.target.style.color='#228B22'}
            onMouseLeave={(e) => e.target.style.color='white'}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-black/95 backdrop-blur-sm">
            <nav className="flex flex-col space-y-4 py-6">
              <button
                onClick={() => scrollToSection('home')}
                className="text-white transition-colors duration-200 font-medium text-left"
                onMouseEnter={(e) => e.target.style.color='#228B22'}
                onMouseLeave={(e) => e.target.style.color='white'}
              >
                Home
              </button>
              <button
                onClick={() => scrollToSection('about')}
                className="text-white transition-colors duration-200 font-medium text-left"
                onMouseEnter={(e) => e.target.style.color='#228B22'}
                onMouseLeave={(e) => e.target.style.color='white'}
              >
                About
              </button>
              <button
                onClick={() => scrollToSection('services')}
                className="text-white transition-colors duration-200 font-medium text-left"
                onMouseEnter={(e) => e.target.style.color='#228B22'}
                onMouseLeave={(e) => e.target.style.color='white'}
              >
                Services
              </button>
              <button
                onClick={() => scrollToSection('portfolio')}
                className="text-white transition-colors duration-200 font-medium text-left"
                onMouseEnter={(e) => e.target.style.color='#228B22'}
                onMouseLeave={(e) => e.target.style.color='white'}
              >
                Portfolio
              </button>
              <button
                onClick={() => scrollToSection('contact')}
                className="text-white transition-colors duration-200 font-medium text-left"
                onMouseEnter={(e) => e.target.style.color='#228B22'}
                onMouseLeave={(e) => e.target.style.color='white'}
              >
                Contact
              </button>
              <Button
                onClick={() => scrollToSection('contact')}
                className="text-white w-full"
                style={{ backgroundColor: '#228B22' }}
                onMouseEnter={(e) => e.target.style.backgroundColor='#1e7b1e'}
                onMouseLeave={(e) => e.target.style.backgroundColor='#228B22'}
              >
                Get a Quote
              </Button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
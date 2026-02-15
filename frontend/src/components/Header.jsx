import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Button } from './ui/button';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigateToSection = (id) => {
    setIsMobileMenuOpen(false);
    
    if (location.pathname === '/') {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      } else if (id === 'home') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      if (id === 'home') {
        navigate('/');
      } else {
        navigate(`/#${id}`);
      }
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
              onClick={() => navigateToSection('home')}
            />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => navigateToSection('home')}
              className="text-white transition-colors duration-200 font-medium"
              onMouseEnter={(e) => e.target.style.color='#228B22'}
              onMouseLeave={(e) => e.target.style.color='white'}
            >
              Home
            </button>
            <button
              onClick={() => navigateToSection('capabilities')}
              className="text-white transition-colors duration-200 font-medium"
              onMouseEnter={(e) => e.target.style.color='#228B22'}
              onMouseLeave={(e) => e.target.style.color='white'}
            >
              Capabilities
            </button>
            <button
              onClick={() => navigateToSection('portfolio')}
              className="text-white transition-colors duration-200 font-medium"
              onMouseEnter={(e) => e.target.style.color='#228B22'}
              onMouseLeave={(e) => e.target.style.color='white'}
            >
              Portfolio
            </button>
            <button
              onClick={() => navigateToSection('coverage')}
              className="text-white transition-colors duration-200 font-medium"
              onMouseEnter={(e) => e.target.style.color='#228B22'}
              onMouseLeave={(e) => e.target.style.color='white'}
            >
              Coverage
            </button>
            <Button
              onClick={() => navigateToSection('partner')}
              className="text-white px-6 py-2 transition-colors duration-200"
              style={{ backgroundColor: '#228B22' }}
              onMouseEnter={(e) => e.target.style.backgroundColor='#1e7b1e'}
              onMouseLeave={(e) => e.target.style.backgroundColor='#228B22'}
            >
              Partner With Us
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
                onClick={() => navigateToSection('home')}
                className="text-white transition-colors duration-200 font-medium text-left"
                onMouseEnter={(e) => e.target.style.color='#228B22'}
                onMouseLeave={(e) => e.target.style.color='white'}
              >
                Home
              </button>
              <button
                onClick={() => navigateToSection('capabilities')}
                className="text-white transition-colors duration-200 font-medium text-left"
                onMouseEnter={(e) => e.target.style.color='#228B22'}
                onMouseLeave={(e) => e.target.style.color='white'}
              >
                Capabilities
              </button>
              <button
                onClick={() => navigateToSection('portfolio')}
                className="text-white transition-colors duration-200 font-medium text-left"
                onMouseEnter={(e) => e.target.style.color='#228B22'}
                onMouseLeave={(e) => e.target.style.color='white'}
              >
                Portfolio
              </button>
              <button
                onClick={() => navigateToSection('coverage')}
                className="text-white transition-colors duration-200 font-medium text-left"
                onMouseEnter={(e) => e.target.style.color='#228B22'}
                onMouseLeave={(e) => e.target.style.color='white'}
              >
                Coverage
              </button>
              <Button
                onClick={() => navigateToSection('partner')}
                className="text-white w-full"
                style={{ backgroundColor: '#228B22' }}
                onMouseEnter={(e) => e.target.style.backgroundColor='#1e7b1e'}
                onMouseLeave={(e) => e.target.style.backgroundColor='#228B22'}
              >
                Partner With Us
              </Button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;

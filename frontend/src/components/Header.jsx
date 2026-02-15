import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Menu, X, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';
import { locations } from '../data/locations';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLocationsOpen, setIsLocationsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Group locations by region
  const groupedLocations = locations.reduce((acc, loc) => {
    if (!acc[loc.region]) {
      acc[loc.region] = [];
    }
    acc[loc.region].push(loc);
    return acc;
  }, {});

  const regionOrder = [
    'Okanagan Valley',
    'Thompson-Okanagan',
    'Thompson-Nicola',
    'Fraser Valley',
    'Coastal BC',
    'Vancouver Island'
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsLocationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navigateToSection = (id) => {
    setIsMobileMenuOpen(false);
    setIsLocationsOpen(false);
    
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
          <nav className="hidden md:flex items-center space-x-6">
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
            
            {/* Locations Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsLocationsOpen(!isLocationsOpen)}
                className="text-white transition-colors duration-200 font-medium flex items-center"
                onMouseEnter={(e) => e.currentTarget.style.color='#228B22'}
                onMouseLeave={(e) => e.currentTarget.style.color='white'}
              >
                Locations
                <ChevronDown size={16} className={`ml-1 transition-transform ${isLocationsOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isLocationsOpen && (
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-black/95 backdrop-blur-sm rounded-lg shadow-xl border border-gray-800 py-4 min-w-[600px] max-h-[70vh] overflow-y-auto">
                  <div className="grid grid-cols-3 gap-4 px-4">
                    {regionOrder.map((region) => (
                      groupedLocations[region] && (
                        <div key={region}>
                          <h4 className="text-red-600 font-bold text-sm mb-2 px-2" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                            {region}
                          </h4>
                          <ul className="space-y-1">
                            {groupedLocations[region].map((loc) => (
                              <li key={loc.slug}>
                                <Link
                                  to={`/locations/${loc.slug}`}
                                  className="block px-2 py-1 text-gray-300 hover:text-white hover:bg-gray-800 rounded text-sm transition-colors"
                                  onClick={() => setIsLocationsOpen(false)}
                                  style={{ fontFamily: 'Open Sans, sans-serif' }}
                                >
                                  {loc.city}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}
            </div>

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
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-black/95 backdrop-blur-sm max-h-[80vh] overflow-y-auto">
            <nav className="flex flex-col space-y-4 py-6">
              <button
                onClick={() => navigateToSection('home')}
                className="text-white transition-colors duration-200 font-medium text-left"
              >
                Home
              </button>
              <button
                onClick={() => navigateToSection('capabilities')}
                className="text-white transition-colors duration-200 font-medium text-left"
              >
                Capabilities
              </button>
              <button
                onClick={() => navigateToSection('portfolio')}
                className="text-white transition-colors duration-200 font-medium text-left"
              >
                Portfolio
              </button>
              
              {/* Mobile Locations */}
              <div className="border-t border-gray-800 pt-4">
                <p className="text-red-600 font-bold mb-3" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                  Service Locations
                </p>
                {regionOrder.map((region) => (
                  groupedLocations[region] && (
                    <div key={region} className="mb-4">
                      <p className="text-gray-400 text-sm font-semibold mb-2">{region}</p>
                      <div className="flex flex-wrap gap-2">
                        {groupedLocations[region].map((loc) => (
                          <Link
                            key={loc.slug}
                            to={`/locations/${loc.slug}`}
                            className="text-gray-300 text-sm hover:text-white px-2 py-1 bg-gray-800 rounded"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            {loc.city}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )
                ))}
              </div>

              <Button
                onClick={() => navigateToSection('partner')}
                className="text-white w-full mt-4"
                style={{ backgroundColor: '#228B22' }}
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

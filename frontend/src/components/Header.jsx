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
    'Coastal BC',
    'Vancouver Island',
    'Fraser Valley',
    'Thompson-Okanagan',
    'Thompson-Nicola'
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

            <Link
              to="/contractors"
              className="text-white transition-colors duration-200 font-medium"
              onMouseEnter={(e) => e.target.style.color='#228B22'}
              onMouseLeave={(e) => e.target.style.color='white'}
            >
              Marketplace
            </Link>
            
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
                <div className="absolute top-full right-0 mt-2 bg-black/95 backdrop-blur-sm rounded-lg shadow-xl border border-gray-800 py-3 w-[520px]">
                  <div className="flex">
                    {/* Column 1 */}
                    <div className="flex-1 px-4 border-r border-gray-800">
                      {['Okanagan Valley', 'Fraser Valley'].map((region) => (
                        groupedLocations[region] && (
                          <div key={region} className="mb-3">
                            <h4 className="text-red-600 font-bold text-xs uppercase tracking-wide mb-1" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                              {region}
                            </h4>
                            {groupedLocations[region].map((loc) => (
                              <Link
                                key={loc.slug}
                                to={`/locations/${loc.slug}`}
                                className="block text-gray-300 hover:text-white text-sm py-0.5 transition-colors"
                                onClick={() => setIsLocationsOpen(false)}
                              >
                                {loc.city}
                              </Link>
                            ))}
                          </div>
                        )
                      ))}
                    </div>
                    {/* Column 2 */}
                    <div className="flex-1 px-4 border-r border-gray-800">
                      {['Coastal BC', 'Thompson-Okanagan'].map((region) => (
                        groupedLocations[region] && (
                          <div key={region} className="mb-3">
                            <h4 className="text-red-600 font-bold text-xs uppercase tracking-wide mb-1" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                              {region}
                            </h4>
                            {groupedLocations[region].map((loc) => (
                              <Link
                                key={loc.slug}
                                to={`/locations/${loc.slug}`}
                                className="block text-gray-300 hover:text-white text-sm py-0.5 transition-colors"
                                onClick={() => setIsLocationsOpen(false)}
                              >
                                {loc.city}
                              </Link>
                            ))}
                          </div>
                        )
                      ))}
                    </div>
                    {/* Column 3 */}
                    <div className="flex-1 px-4">
                      {['Vancouver Island', 'Thompson-Nicola'].map((region) => (
                        groupedLocations[region] && (
                          <div key={region} className="mb-3">
                            <h4 className="text-red-600 font-bold text-xs uppercase tracking-wide mb-1" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                              {region}
                            </h4>
                            {groupedLocations[region].map((loc) => (
                              <Link
                                key={loc.slug}
                                to={`/locations/${loc.slug}`}
                                className="block text-gray-300 hover:text-white text-sm py-0.5 transition-colors"
                                onClick={() => setIsLocationsOpen(false)}
                              >
                                {loc.city}
                              </Link>
                            ))}
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Button
              onClick={() => navigateToSection('estimating')}
              className="text-white px-6 py-2 transition-colors duration-200"
              style={{ backgroundColor: '#228B22' }}
              onMouseEnter={(e) => e.target.style.backgroundColor='#1e7b1e'}
              onMouseLeave={(e) => e.target.style.backgroundColor='#228B22'}
            >
              Request Estimating
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

              <Link
                to="/contractors"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-white transition-colors duration-200 font-medium text-left"
              >
                Marketplace
              </Link>
              
              {/* Mobile Locations */}
              <div className="border-t border-gray-800 pt-4">
                <p className="text-red-600 font-bold mb-3" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                  Service Locations
                </p>
                {regionOrder.map((region) => (
                  groupedLocations[region] && (
                    <div key={region} className="mb-3">
                      <p className="text-gray-500 text-xs font-semibold mb-1 uppercase">{region}</p>
                      {groupedLocations[region].map((loc) => (
                        <Link
                          key={loc.slug}
                          to={`/locations/${loc.slug}`}
                          className="block text-gray-300 text-sm py-0.5 hover:text-white"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          {loc.city}
                        </Link>
                      ))}
                    </div>
                  )
                ))}
              </div>

              <Button
                onClick={() => navigateToSection('estimating')}
                className="text-white w-full mt-4"
                style={{ backgroundColor: '#228B22' }}
              >
                Request Estimating
              </Button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;

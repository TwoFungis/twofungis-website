import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { locations } from '../data/locations';
import Header from '../components/Header';
import Services from '../components/Services';
import Portfolio from '../components/Portfolio';
import Contact from '../components/Contact';
import Footer from '../components/Footer';
import { Button } from '../components/ui/button';
import { MapPin, Phone, Mail, CheckCircle2 } from 'lucide-react';

const LocationPage = () => {
  const { city } = useParams();
  const navigate = useNavigate();
  const location = locations.find(loc => loc.slug === city);

  useEffect(() => {
    if (location) {
      document.title = `${location.city} Interior Finishing & Millwork | Two Fungis Ltd | ${location.region}`;
      
      // Update meta description
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', location.description);
      }
    }
  }, [location]);

  if (!location) {
    navigate('/');
    return null;
  }

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      {/* Location Hero */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden pt-20 bg-black">

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Logo */}
            <div className="mb-6 flex justify-center">
              <img
                src="https://customer-assets.emergentagent.com/job_okanagan-interiors/artifacts/x3dcmfph_image%20%281%29.png"
                alt="Two Fungis Ltd"
                className="h-32 md:h-40 w-auto drop-shadow-2xl"
              />
            </div>
            
            <div className="flex items-center justify-center gap-2 mb-4">
              <MapPin className="text-red-600" size={28} />
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                Interior Finishing in <span className="text-red-600">{location.city}</span>
              </h1>
            </div>
            
            <p className="text-xl sm:text-2xl text-gray-300 mb-6" style={{ fontFamily: 'Open Sans, sans-serif' }}>
              {location.description}
            </p>

            <div className="flex flex-wrap gap-3 justify-center mb-8 text-gray-400">
              <span className="flex items-center gap-2">
                <CheckCircle2 size={20} style={{ color: '#228B22' }} />
                25+ Years Experience
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 size={20} style={{ color: '#228B22' }} />
                $5M Insured
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 size={20} style={{ color: '#228B22' }} />
                Local Experts
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => scrollToSection('contact')}
                className="text-white px-8 py-6 text-lg font-semibold"
                style={{ backgroundColor: '#228B22' }}
                onMouseEnter={(e) => e.target.style.backgroundColor='#1e7b1e'}
                onMouseLeave={(e) => e.target.style.backgroundColor='#228B22'}
              >
                Get a Free Quote in {location.city}
              </Button>
              <Button
                onClick={() => scrollToSection('portfolio')}
                variant="outline"
                className="text-white px-8 py-6 text-lg font-semibold"
                style={{ borderColor: '#228B22', borderWidth: '2px' }}
                onMouseEnter={(e) => { e.target.style.backgroundColor = '#228B22'; e.target.style.color = 'black'; }}
                onMouseLeave={(e) => { e.target.style.backgroundColor = 'transparent'; e.target.style.color = 'white'; }}
              >
                View Our Work
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Location-Specific Content */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-black mb-6" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
              Premier Interior Finishing Services in {location.city}, {location.region}
            </h2>
            
            <div className="prose prose-lg max-w-none">
              <p className="text-gray-700 leading-relaxed mb-4" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                Two Fungis Ltd is proud to serve {location.city} and surrounding areas in {location.region}. With over 25 years of combined experience, our founders Scott Marshall and Beau Suprun bring unparalleled expertise in interior finishing, commercial millwork, and precision carpentry to every project.
              </p>
              
              <h3 className="text-2xl font-bold text-black mb-4 mt-8" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                Our Services in {location.city}
              </h3>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <CheckCircle2 className="text-red-600 mr-3 flex-shrink-0 mt-1" size={20} />
                  <span className="text-gray-700" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                    <strong>Residential Interior Finishing:</strong> Custom millwork, trim installation, and finishing carpentry for homes
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="text-red-600 mr-3 flex-shrink-0 mt-1" size={20} />
                  <span className="text-gray-700" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                    <strong>Commercial Millwork:</strong> Professional-grade solutions for offices, retail spaces, and commercial buildings
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="text-red-600 mr-3 flex-shrink-0 mt-1" size={20} />
                  <span className="text-gray-700" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                    <strong>Multi-Unit Finishing:</strong> Expert management and installation for apartment buildings and condominiums
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="text-red-600 mr-3 flex-shrink-0 mt-1" size={20} />
                  <span className="text-gray-700" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                    <strong>Cabinet Installation:</strong> Precision cabinet installation for kitchens, bathrooms, and custom spaces
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="text-red-600 mr-3 flex-shrink-0 mt-1" size={20} />
                  <span className="text-gray-700" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                    <strong>Flooring Installation:</strong> Expert hardwood, laminate, and engineered flooring services
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="text-red-600 mr-3 flex-shrink-0 mt-1" size={20} />
                  <span className="text-gray-700" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                    <strong>High-Rise Projects:</strong> Specialized finishing for high-rise commercial and residential buildings
                  </span>
                </li>
              </ul>

              <h3 className="text-2xl font-bold text-black mb-4 mt-8" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                Why Choose Two Fungis Ltd in {location.city}?
              </h3>
              
              <p className="text-gray-700 leading-relaxed mb-4" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                We're not just contractors – we're craftsmen who take pride in every detail. Our team brings together Scott Marshall's 25 years of hands-on experience in millwork and finishing carpentry, and Beau Suprun's exceptional eye for detail as a master craftsman and machinist. This combination of experience and precision ensures your project in {location.city} exceeds expectations.
              </p>

              {location.keyProjects && location.keyProjects.length > 0 && (
                <>
                  <h3 className="text-2xl font-bold text-black mb-4 mt-8" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                    Project Types We Serve in {location.city}
                  </h3>
                  <ul className="space-y-2 mb-8">
                    {location.keyProjects.map((project, index) => (
                      <li key={index} className="flex items-center text-gray-700">
                        <div className="w-2 h-2 bg-red-600 rounded-full mr-3"></div>
                        <span style={{ fontFamily: 'Open Sans, sans-serif' }}>{project}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              <div className="bg-gray-50 p-6 rounded-lg mt-8">
                <h3 className="text-xl font-bold text-black mb-3" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                  Ready to Start Your Project in {location.city}?
                </h3>
                <p className="text-gray-700 mb-4" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                  Contact us today for a free consultation and quote. We're fully insured with $5 million liability coverage and ready to bring your vision to life.
                </p>
                <div className="flex flex-wrap gap-4">
                  <a href="tel:778-268-4920" className="flex items-center text-red-600 hover:text-red-700 font-semibold">
                    <Phone size={20} className="mr-2" />
                    778-268-4920
                  </a>
                  <a href="mailto:inbox@twofungis.ca" className="flex items-center text-red-600 hover:text-red-700 font-semibold">
                    <Mail size={20} className="mr-2" />
                    inbox@twofungis.ca
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Services />
      <Portfolio />
      <Contact />
      <Footer />
    </div>
  );
};

export default LocationPage;

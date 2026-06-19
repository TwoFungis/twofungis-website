import React from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-black text-white py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            {/* Company Info */}
            <div>
              <Link to="/#home">
                <img
                  src="https://customer-assets.emergentagent.com/job_okanagan-interiors/artifacts/x3dcmfph_image%20%281%29.png"
                  alt="Two Fungis Ltd"
                  className="h-20 w-auto mb-4 cursor-pointer"
                />
              </Link>
              <p className="text-gray-400 mb-4" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                Premium interior finishing services for residential, commercial, and high-rise projects across Okanagan to Vancouver Island.
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full" style={{ backgroundColor: 'rgba(34, 139, 34, 0.2)', border: '1px solid rgba(34, 139, 34, 0.5)' }}>
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#228B22' }}></div>
                <span className="text-sm font-medium" style={{ color: '#32CD32' }}>$5M Insured</span>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-xl font-bold mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>Quick Links</h3>
              <ul className="space-y-2" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                <li>
                  <Link to="/#home" className="text-gray-400 transition-colors" onMouseEnter={(e) => e.target.style.color='#228B22'} onMouseLeave={(e) => e.target.style.color='#9ca3af'}>Home</Link>
                </li>
                <li>
                  <Link to="/#about" className="text-gray-400 transition-colors" onMouseEnter={(e) => e.target.style.color='#228B22'} onMouseLeave={(e) => e.target.style.color='#9ca3af'}>About Us</Link>
                </li>
                <li>
                  <Link to="/#services" className="text-gray-400 transition-colors" onMouseEnter={(e) => e.target.style.color='#228B22'} onMouseLeave={(e) => e.target.style.color='#9ca3af'}>Services</Link>
                </li>
                <li>
                  <Link to="/#portfolio" className="text-gray-400 transition-colors" onMouseEnter={(e) => e.target.style.color='#228B22'} onMouseLeave={(e) => e.target.style.color='#9ca3af'}>Portfolio</Link>
                </li>
                <li>
                  <Link to="/#contact" className="text-gray-400 transition-colors" onMouseEnter={(e) => e.target.style.color='#228B22'} onMouseLeave={(e) => e.target.style.color='#9ca3af'}>Contact</Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-xl font-bold mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>Contact Us</h3>
              <ul className="space-y-3" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                <li className="flex items-start">
                  <MapPin style={{ color: '#228B22' }} className="mr-2 flex-shrink-0 mt-1" size={18} />
                  <span className="text-gray-400">Okanagan to Vancouver Island</span>
                </li>
                <li className="flex items-start">
                  <Phone className="text-red-600 mr-2 flex-shrink-0 mt-1" size={18} />
                  <div>
                    <a href="tel:778-268-4920" className="text-gray-400 transition-colors block" onMouseEnter={(e) => e.target.style.color='#228B22'} onMouseLeave={(e) => e.target.style.color='#9ca3af'}>778-268-4920</a>
                    <span className="text-gray-500 text-xs">Scott Marshall — Thompson / Okanagan / Fraser Valley</span>
                  </div>
                </li>
                <li className="flex items-start">
                  <Phone className="text-red-600 mr-2 flex-shrink-0 mt-1" size={18} />
                  <div>
                    <a href="tel:250-327-8202" className="text-gray-400 transition-colors block" onMouseEnter={(e) => e.target.style.color='#228B22'} onMouseLeave={(e) => e.target.style.color='#9ca3af'}>250-327-8202</a>
                    <span className="text-gray-500 text-xs">Beau Suprun — Vancouver Island / Lower Mainland</span>
                  </div>
                </li>
                <li className="flex items-start">
                  <Mail className="text-red-600 mr-2 flex-shrink-0 mt-1" size={18} />
                  <a href="mailto:inbox@twofungis.ca" className="text-gray-400 transition-colors" onMouseEnter={(e) => e.target.style.color='#228B22'} onMouseLeave={(e) => e.target.style.color='#9ca3af'}>inbox@twofungis.ca</a>
                </li>
              </ul>
            </div>
          </div>

          {/* Trust Badges Row */}
          <div className="border-t border-gray-800 pt-8 pb-6 flex flex-col sm:flex-row items-center justify-center gap-6">
            <span className="text-gray-500 text-sm uppercase tracking-wider" style={{ fontFamily: 'Open Sans, sans-serif' }}>
              Verified Member of
            </span>
            <a
              href="https://network.procore.com/p/two-fungis-ltd-penticton"
              target="_blank"
              rel="noopener noreferrer dofollow"
              className="bg-white p-3 rounded-md hover:scale-105 transition-transform"
              data-testid="procore-badge-footer"
              aria-label="Two Fungis Ltd on the Procore Construction Network"
            >
              <img
                src="https://network.procore.com/assets/static/procore-black-badge.svg"
                alt="Procore Construction Network — Two Fungis Ltd"
                className="h-14 w-auto"
              />
            </a>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-gray-400" style={{ fontFamily: 'Open Sans, sans-serif' }}>
              © {currentYear} Two Fungis Ltd. All rights reserved. | Serving Okanagan to Vancouver Island since 2017
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
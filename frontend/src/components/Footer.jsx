import React from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-black text-white py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            {/* Company Info */}
            <div>
              <img
                src="https://customer-assets.emergentagent.com/job_okanagan-interiors/artifacts/x3dcmfph_image%20%281%29.png"
                alt="Two Fungis Ltd"
                className="h-20 w-auto mb-4"
              />
              <p className="text-gray-400 mb-4" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                A trusted finishing subcontractor for residential, commercial, multi-family & high-rise projects across British Columbia.
              </p>
              <div className="flex flex-wrap gap-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full" style={{ backgroundColor: 'rgba(34, 139, 34, 0.2)', border: '1px solid rgba(34, 139, 34, 0.5)' }}>
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#228B22' }}></div>
                  <span className="text-xs font-medium" style={{ color: '#32CD32' }}>$5M Insured</span>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full" style={{ backgroundColor: 'rgba(34, 139, 34, 0.2)', border: '1px solid rgba(34, 139, 34, 0.5)' }}>
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#228B22' }}></div>
                  <span className="text-xs font-medium" style={{ color: '#32CD32' }}>WorkSafe Compliant</span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-xl font-bold mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>Quick Links</h3>
              <ul className="space-y-2" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                <li>
                  <a href="/#home" className="text-gray-400 transition-colors" onMouseEnter={(e) => e.target.style.color='#228B22'} onMouseLeave={(e) => e.target.style.color='#9ca3af'}>Home</a>
                </li>
                <li>
                  <a href="/#capabilities" className="text-gray-400 transition-colors" onMouseEnter={(e) => e.target.style.color='#228B22'} onMouseLeave={(e) => e.target.style.color='#9ca3af'}>Capabilities</a>
                </li>
                <li>
                  <a href="/#portfolio" className="text-gray-400 transition-colors" onMouseEnter={(e) => e.target.style.color='#228B22'} onMouseLeave={(e) => e.target.style.color='#9ca3af'}>Portfolio</a>
                </li>
                <li>
                  <a href="/#coverage" className="text-gray-400 transition-colors" onMouseEnter={(e) => e.target.style.color='#228B22'} onMouseLeave={(e) => e.target.style.color='#9ca3af'}>Regional Coverage</a>
                </li>
                <li>
                  <a href="/#partner" className="text-gray-400 transition-colors" onMouseEnter={(e) => e.target.style.color='#228B22'} onMouseLeave={(e) => e.target.style.color='#9ca3af'}>Partner With Us</a>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-xl font-bold mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>Contact</h3>
              <ul className="space-y-3" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                <li className="flex items-start">
                  <MapPin style={{ color: '#228B22' }} className="mr-2 flex-shrink-0 mt-1" size={18} />
                  <span className="text-gray-400">Coastal BC, Vancouver Island & Okanagan</span>
                </li>
                <li className="flex items-start">
                  <Phone className="text-red-600 mr-2 flex-shrink-0 mt-1" size={18} />
                  <a href="tel:778-268-4920" className="text-gray-400 transition-colors" onMouseEnter={(e) => e.target.style.color='#228B22'} onMouseLeave={(e) => e.target.style.color='#9ca3af'}>778-268-4920</a>
                </li>
                <li className="flex items-start">
                  <Mail className="text-red-600 mr-2 flex-shrink-0 mt-1" size={18} />
                  <a href="mailto:inbox@twofungis.ca" className="text-gray-400 transition-colors" onMouseEnter={(e) => e.target.style.color='#228B22'} onMouseLeave={(e) => e.target.style.color='#9ca3af'}>inbox@twofungis.ca</a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-gray-400 text-sm" style={{ fontFamily: 'Open Sans, sans-serif' }}>
              © {currentYear} Two Fungis Ltd. All rights reserved. | A finishing subcontractor you can build with.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

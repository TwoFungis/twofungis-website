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
                src="https://customer-assets.emergentagent.com/job_okanagan-interiors/artifacts/lpeiqs4k_Screenshot_20200227_085449_com.android.gallery3d.jpg"
                alt="Two Fungis Ltd"
                className="h-12 w-auto mb-4"
              />
              <p className="text-gray-400 mb-4" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                Premium interior finishing services for residential, commercial, and high-rise projects across the Okanagan region.
              </p>
              <div className="inline-flex items-center gap-2 bg-green-600/20 border border-green-600/50 px-4 py-2 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-green-400 text-sm font-medium">$5M Insured</span>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-xl font-bold mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>Quick Links</h3>
              <ul className="space-y-2" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                <li>
                  <a href="#home" className="text-gray-400 hover:text-red-600 transition-colors">Home</a>
                </li>
                <li>
                  <a href="#about" className="text-gray-400 hover:text-red-600 transition-colors">About Us</a>
                </li>
                <li>
                  <a href="#services" className="text-gray-400 hover:text-red-600 transition-colors">Services</a>
                </li>
                <li>
                  <a href="#portfolio" className="text-gray-400 hover:text-red-600 transition-colors">Portfolio</a>
                </li>
                <li>
                  <a href="#contact" className="text-gray-400 hover:text-red-600 transition-colors">Contact</a>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-xl font-bold mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>Contact Us</h3>
              <ul className="space-y-3" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                <li className="flex items-start">
                  <MapPin className="text-red-600 mr-2 flex-shrink-0 mt-1" size={18} />
                  <span className="text-gray-400">Okanagan Region, BC</span>
                </li>
                <li className="flex items-start">
                  <Phone className="text-red-600 mr-2 flex-shrink-0 mt-1" size={18} />
                  <span className="text-gray-400">Contact for details</span>
                </li>
                <li className="flex items-start">
                  <Mail className="text-red-600 mr-2 flex-shrink-0 mt-1" size={18} />
                  <span className="text-gray-400">info@twofungis.com</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-gray-400" style={{ fontFamily: 'Open Sans, sans-serif' }}>
              © {currentYear} Two Fungis Ltd. All rights reserved. | Serving the Okanagan Region since 2017
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
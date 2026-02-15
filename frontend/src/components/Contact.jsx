import React from 'react';
import { Button } from './ui/button';
import { Mail, Phone, MapPin } from 'lucide-react';

const Contact = () => {
  return (
    <section id="contact" className="py-20 bg-black">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
              Get in <span className="text-red-600">Touch</span>
            </h2>
            <div className="w-24 h-1 bg-red-600 mx-auto mb-6"></div>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto" style={{ fontFamily: 'Open Sans, sans-serif' }}>
              Ready to start your project? Contact us for a free consultation and quote
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            {/* Main Contact Card */}
            <div className="bg-black p-12 rounded-xl shadow-2xl text-center mb-12 border border-red-600/30">
              <h3 className="text-3xl font-bold text-white mb-8" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                Contact Two Fungis Ltd
              </h3>
              
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                {/* Phone */}
                <a 
                  href="tel:778-268-4920"
                  className="flex flex-col items-center p-6 bg-black rounded-lg border border-red-600/30 hover:border-red-600 transition-colors group"
                >
                  <div className="p-4 rounded-full mb-4 group-hover:scale-110 transition-transform" style={{ backgroundColor: '#228B22' }}>
                    <Phone className="text-white" size={32} />
                  </div>
                  <h4 className="font-bold text-white mb-2 text-xl" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>Call Us</h4>
                  <p className="text-2xl font-bold text-red-600 mb-1">778-268-4920</p>
                  <p className="text-gray-400 text-sm">Scott Marshall</p>
                </a>

                {/* Email */}
                <a 
                  href="mailto:inbox@twofungis.ca"
                  className="flex flex-col items-center p-6 bg-black rounded-lg border border-red-600/30 hover:border-red-600 transition-colors group"
                >
                  <div className="p-4 rounded-full mb-4 group-hover:scale-110 transition-transform" style={{ backgroundColor: '#228B22' }}>
                    <Mail className="text-white" size={32} />
                  </div>
                  <h4 className="font-bold text-white mb-2 text-xl" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>Email Us</h4>
                  <p className="text-xl font-bold text-red-600 break-all">inbox@twofungis.ca</p>
                  <p className="text-gray-400 text-sm mt-1">We respond within 24 hours</p>
                </a>
              </div>

              <div className="text-white p-6 rounded-lg mb-8" style={{ backgroundColor: '#228B22' }}>
                <p className="text-lg font-semibold mb-2" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                  $5 Million Liability Insurance
                </p>
                <p className="text-sm" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                  Fully insured for your peace of mind
                </p>
              </div>
            </div>

            {/* Additional Info Grid */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-gray-900 p-6 rounded-lg shadow-lg text-center border border-gray-800">
                <MapPin style={{ color: '#228B22' }} className="mx-auto mb-3" size={32} />
                <h4 className="font-bold text-white mb-2" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>Service Area</h4>
                <p className="text-gray-400 text-sm" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                  Coastal B.C and Vancouver Island
                </p>
              </div>

              <div className="bg-gray-900 p-6 rounded-lg shadow-lg text-center border border-gray-800">
                <div className="text-3xl font-bold mb-2" style={{ fontFamily: 'Bebas Neue, sans-serif', color: '#228B22' }}>25+</div>
                <h4 className="font-bold text-white mb-2" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>Years Experience</h4>
                <p className="text-gray-400 text-sm" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                  Expert craftsmanship since 1999
                </p>
              </div>

              <div className="bg-gray-900 p-6 rounded-lg shadow-lg text-center border border-gray-800">
                <div className="text-3xl font-bold mb-2" style={{ fontFamily: 'Bebas Neue, sans-serif', color: '#228B22' }}>24hr</div>
                <h4 className="font-bold text-white mb-2" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>Response Time</h4>
                <p className="text-gray-400 text-sm" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                  Quick replies to all inquiries
                </p>
              </div>
            </div>

            {/* Business Hours */}
            <div className="mt-8 bg-gray-900 text-white p-8 rounded-lg text-center border border-gray-800">
              <h4 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                Business Hours
              </h4>
              <div className="grid sm:grid-cols-3 gap-4 text-sm" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                <div>
                  <p className="font-semibold text-red-600">Monday - Friday</p>
                  <p className="text-gray-300">7:00 AM - 5:00 PM</p>
                </div>
                <div>
                  <p className="font-semibold text-red-600">Saturday</p>
                  <p className="text-gray-300">8:00 AM - 2:00 PM</p>
                </div>
                <div>
                  <p className="font-semibold text-red-600">Sunday</p>
                  <p className="text-gray-300">Closed</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
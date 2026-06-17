import React from 'react';
import { Mail, Phone } from 'lucide-react';

const Contact = () => {
  return (
    <section id="contact" className="py-12 bg-gray-50">
      {/* Full-width marketing banner above */}
      <div className="w-full mb-10">
        <img
          src="https://customer-assets.emergentagent.com/job_find-twofungis/artifacts/xl34d4lz_ChatGPT%20Image%20Jun%2017%2C%202026%2C%2012_07_03%20PM.png"
          alt="Two Fungis Ltd - From Frame to Finish"
          className="w-full h-auto block"
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="flex flex-col items-center justify-center gap-3 mb-4">
              <img src="https://customer-assets.emergentagent.com/job_okanagan-interiors/artifacts/x3dcmfph_image%20%281%29.png" alt="Two Fungis Ltd" className="h-20 md:h-24 w-auto" />
              <h2 className="text-4xl sm:text-5xl font-bold text-black" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                Get in <span className="text-red-600">Touch</span>
              </h2>
            </div>
            <div className="w-24 h-1 bg-red-600 mx-auto mb-6"></div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto" style={{ fontFamily: 'Open Sans, sans-serif' }}>
              Ready to start your project? Contact us for a free consultation and quote
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            {/* Main Contact Card - BLACK background */}
            <div className="bg-black p-12 rounded-xl shadow-2xl text-center mb-12">
              <h3 className="text-3xl font-bold text-white mb-8" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                Contact Two Fungis Ltd
              </h3>
              
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                {/* Phone - WHITE box */}
                <a 
                  href="tel:778-268-4920"
                  className="flex flex-col items-center p-6 bg-white rounded-lg hover:bg-gray-100 transition-colors group"
                >
                  <div className="p-4 rounded-full mb-4 group-hover:scale-110 transition-transform" style={{ backgroundColor: '#228B22' }}>
                    <Phone className="text-white" size={32} />
                  </div>
                  <h4 className="font-bold text-black mb-2 text-xl" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>Call Us</h4>
                  <p className="text-2xl font-bold text-red-600 mb-1">778-268-4920</p>
                  <p className="text-gray-500 text-sm">Scott Marshall</p>
                </a>

                {/* Email - WHITE box */}
                <a 
                  href="mailto:inbox@twofungis.ca"
                  className="flex flex-col items-center p-6 bg-white rounded-lg hover:bg-gray-100 transition-colors group"
                >
                  <div className="p-4 rounded-full mb-4 group-hover:scale-110 transition-transform" style={{ backgroundColor: '#228B22' }}>
                    <Mail className="text-white" size={32} />
                  </div>
                  <h4 className="font-bold text-black mb-2 text-xl" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>Email Us</h4>
                  <p className="text-xl font-bold text-red-600 break-all">inbox@twofungis.ca</p>
                  <p className="text-gray-500 text-sm mt-1">We respond within 24 hours</p>
                </a>
              </div>

              {/* RED insurance box */}
              <div className="bg-red-600 text-white p-6 rounded-lg mb-8">
                <p className="text-lg font-semibold mb-2" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                  $5 Million Liability Insurance
                </p>
                <p className="text-sm" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                  Fully insured for your peace of mind
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
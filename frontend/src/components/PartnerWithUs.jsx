import React from 'react';
import { Button } from './ui/button';
import { Mail, Phone } from 'lucide-react';

const PartnerWithUs = () => {
  return (
    <section id="partner" className="py-20 bg-black">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
            Partner <span className="text-red-600">With Us</span>
          </h2>
          <div className="w-24 h-1 bg-red-600 mx-auto mb-6"></div>
          <p className="text-lg text-gray-300 mb-10" style={{ fontFamily: 'Open Sans, sans-serif' }}>
            For estimating inquiries, subcontract partnerships, or upcoming finishing packages, contact our team.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-10">
            <a href="tel:778-268-4920">
              <Button
                className="text-white px-8 py-6 text-lg font-semibold transition-all duration-200 hover:scale-105 flex items-center"
                style={{ backgroundColor: '#228B22' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#1e7b1e'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#228B22'}
                data-testid="call-btn"
              >
                <Phone className="mr-2" size={20} />
                778-268-4920
              </Button>
            </a>
            <a href="mailto:inbox@twofungis.ca">
              <Button
                variant="outline"
                className="text-white px-8 py-6 text-lg font-semibold transition-all duration-200 flex items-center"
                style={{ borderColor: '#228B22', borderWidth: '2px' }}
                onMouseEnter={(e) => { e.target.style.backgroundColor = '#228B22'; e.target.style.color = 'black'; }}
                onMouseLeave={(e) => { e.target.style.backgroundColor = 'transparent'; e.target.style.color = 'white'; }}
                data-testid="email-btn"
              >
                <Mail className="mr-2" size={20} />
                inbox@twofungis.ca
              </Button>
            </a>
          </div>

          <p className="text-gray-500 text-sm" style={{ fontFamily: 'Open Sans, sans-serif' }}>
            Two Fungis Ltd — A finishing subcontractor you can build with.
          </p>
        </div>
      </div>
    </section>
  );
};

export default PartnerWithUs;

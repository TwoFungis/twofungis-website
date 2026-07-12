import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { locations } from '../data/locations';
import Header from '../components/Header';
import Services from '../components/Services';
import Portfolio from '../components/Portfolio';
import Contact from '../components/Contact';
import Footer from '../components/Footer';
import PrequalificationModal from '../components/PrequalificationModal';
import TradeOSBanner from '../components/TradeOSBanner';
import { Button } from '../components/ui/button';
import { MapPin, Phone, Mail, CheckCircle2, ChevronRight } from 'lucide-react';

const upsertMeta = (selector, attr, value) => {
  let el = document.querySelector(selector);
  if (!el) {
    el = document.createElement('meta');
    const [name, val] = selector.replace('meta[', '').replace(']', '').split('=');
    el.setAttribute(name, val.replace(/"/g, ''));
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
};

const LocationPage = () => {
  const { city } = useParams();
  const navigate = useNavigate();
  const location = locations.find(loc => loc.slug === city);
  const [prequalOpen, setPrequalOpen] = useState(false);

  useEffect(() => {
    if (location) {
      const title = `${location.city} Commercial Finish Carpentry & Architectural Millwork | Two Fungis Finishing | British Columbia`;
      const desc = `Two Fungis Finishing in ${location.city} — commercial and multifamily finishing contractor specializing in finish carpentry, architectural millwork, doors & hardware, multi-family construction and deficiency completion. ${location.description} Tender invitations and prequalification requests welcome.`;
      const url = `https://twofungis.ca/locations/${location.slug}`;
      const keywords = `commercial finish carpentry ${location.city}, finish carpentry ${location.city}, architectural millwork ${location.city}, doors and hardware ${location.city}, multi-family construction ${location.city}, commercial interiors ${location.city}, deficiency completion ${location.city}, tenant improvements ${location.city}, finishing contractor ${location.region}, Two Fungis Finishing ${location.city}, Two Fungis ${location.city}`;

      document.title = title;
      upsertMeta('meta[name="description"]', 'content', desc);
      upsertMeta('meta[name="keywords"]', 'content', keywords);
      upsertMeta('meta[property="og:title"]', 'content', title);
      upsertMeta('meta[property="og:description"]', 'content', desc);
      upsertMeta('meta[property="og:url"]', 'content', url);
      upsertMeta('meta[property="twitter:title"]', 'content', title);
      upsertMeta('meta[property="twitter:description"]', 'content', desc);
      upsertMeta('meta[property="twitter:url"]', 'content', url);

      // Canonical
      let canonical = document.querySelector('link[rel="canonical"]');
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.setAttribute('rel', 'canonical');
        document.head.appendChild(canonical);
      }
      canonical.setAttribute('href', url);

      // Per-location JSON-LD
      const ldId = 'ld-location';
      let ld = document.getElementById(ldId);
      if (!ld) {
        ld = document.createElement('script');
        ld.type = 'application/ld+json';
        ld.id = ldId;
        document.head.appendChild(ld);
      }
      ld.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'GeneralContractor',
        name: `Two Fungis Finishing — ${location.city}`,
        legalName: 'Two Fungis Ltd.',
        description: desc,
        url,
        email: 'inbox@twofungis.ca',
        priceRange: '$$',
        address: {
          '@type': 'PostalAddress',
          addressLocality: location.city,
          addressRegion: 'BC',
          addressCountry: 'CA',
        },
        areaServed: { '@type': 'City', name: location.city },
        contactPoint: [
          { '@type': 'ContactPoint', telephone: '+1-778-268-4920', contactType: 'sales', name: 'Scott Marshall' },
          { '@type': 'ContactPoint', telephone: '+1-250-327-8202', contactType: 'sales', name: 'Beau Suprun' },
        ],
        founder: [
          { '@type': 'Person', name: 'Scott Marshall' },
          { '@type': 'Person', name: 'Beau Suprun' },
        ],
        foundingDate: '2017',
      });
    }

    return () => {
      const ld = document.getElementById('ld-location');
      if (ld) ld.remove();
    };
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
    <div className="min-h-screen bg-white">
      <TradeOSBanner />
      <Header />
      
      {/* Location Hero */}
      <section className="relative min-h-[50vh] flex items-center justify-center overflow-hidden pt-28 sm:pt-32 md:pt-36 pb-8 bg-black">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-6xl mx-auto text-center">
            {/* Logo - Large, responsive */}
            <div className="mb-8 flex justify-center">
              <img
                src="https://customer-assets.emergentagent.com/job_find-twofungis/artifacts/afq4qky8_ChatGPT%20Image%20Jun%2017%2C%202026%2C%2012_03_36%20PM.png"
                alt="Two Fungis Finishing"
                className="w-full max-w-5xl h-auto drop-shadow-2xl"
              />
            </div>
            
            <div className="flex flex-col items-center justify-center gap-3 mb-4">
              <img src="https://customer-assets.emergentagent.com/job_okanagan-interiors/artifacts/x3dcmfph_image%20%281%29.png" alt="Two Fungis Finishing" className="h-20 md:h-24 w-auto" />
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <MapPin className="text-red-600" size={28} />
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                  Commercial &amp; Multifamily Finishing in <span className="text-red-600">{location.city}</span>
                </h1>
              </div>
            </div>

            <p className="text-lg sm:text-xl text-gray-300 mb-6 max-w-3xl mx-auto" style={{ fontFamily: 'Open Sans, sans-serif' }}>
              {location.description}
            </p>

            <div className="flex flex-wrap gap-3 justify-center mb-8 text-gray-400">
              <span className="flex items-center gap-2">
                <CheckCircle2 size={20} style={{ color: '#228B22' }} />
                $5M Insured
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 size={20} style={{ color: '#228B22' }} />
                WorkSafeBC Compliant
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 size={20} style={{ color: '#228B22' }} />
                BC-Wide Coverage
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => scrollToSection('contact')}
                className="text-white px-8 py-6 text-base font-semibold inline-flex items-center"
                style={{ backgroundColor: '#228B22' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor='#1e7b1e'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor='#228B22'}
                data-testid="location-tender-btn"
              >
                Invite Us to Tender
                <ChevronRight size={18} className="ml-1" />
              </Button>
              <Button
                onClick={() => setPrequalOpen(true)}
                variant="outline"
                className="text-white px-8 py-6 text-base font-semibold inline-flex items-center"
                style={{ borderColor: '#ffffff', borderWidth: '1px', backgroundColor: 'transparent' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; e.currentTarget.style.color = '#000000'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#ffffff'; }}
                data-testid="location-prequal-btn"
              >
                Request Prequalification Package
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Location-Specific Content */}
      <section className="py-10 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col items-start gap-3 mb-6">
              <img src="https://customer-assets.emergentagent.com/job_okanagan-interiors/artifacts/x3dcmfph_image%20%281%29.png" alt="Two Fungis Finishing" className="h-10 md:h-12 w-auto" />
              <h2 className="text-3xl sm:text-4xl font-bold text-black" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                Commercial &amp; Multifamily Finishing Services in {location.city}, {location.region}
              </h2>
            </div>
            
            <div className="prose prose-lg max-w-none">
              <p className="text-gray-700 leading-relaxed mb-4" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                Two Fungis Finishing is proud to serve {location.city} and surrounding areas in {location.region}. With over 20 years of combined experience, our founders Scott Marshall and Beau Suprun bring unparalleled expertise in interior finishing, commercial millwork, and precision carpentry to every project.
              </p>
              
              <h3 className="text-2xl font-bold text-black mb-4 mt-8" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                Our Services in {location.city}
              </h3>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <CheckCircle2 style={{ color: '#228B22' }} className="mr-3 flex-shrink-0 mt-1" size={20} />
                  <span className="text-gray-700" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                    <strong>Finish Carpentry:</strong> Trim, casing, baseboards, crown, stairs and built-ins for commercial and multi-family projects in {location.city}
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 style={{ color: '#228B22' }} className="mr-3 flex-shrink-0 mt-1" size={20} />
                  <span className="text-gray-700" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                    <strong>Architectural Millwork:</strong> Custom millwork installation — feature walls, reception desks, custom cabinetry and bespoke joinery
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 style={{ color: '#228B22' }} className="mr-3 flex-shrink-0 mt-1" size={20} />
                  <span className="text-gray-700" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                    <strong>Doors &amp; Hardware:</strong> Commercial and fire-rated doors with full hardware scheduling and install
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 style={{ color: '#228B22' }} className="mr-3 flex-shrink-0 mt-1" size={20} />
                  <span className="text-gray-700" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                    <strong>Multi-Family Construction:</strong> Suite finishing packages and common-area millwork for {location.city} developments
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 style={{ color: '#228B22' }} className="mr-3 flex-shrink-0 mt-1" size={20} />
                  <span className="text-gray-700" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                    <strong>Commercial Interiors &amp; Tenant Improvements:</strong> Office, retail, hospitality fit-outs and TIs
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 style={{ color: '#228B22' }} className="mr-3 flex-shrink-0 mt-1" size={20} />
                  <span className="text-gray-700" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                    <strong>Deficiency Completion:</strong> Punch-lists, warranty repairs and documented closeout for {location.city} projects
                  </span>
                </li>
              </ul>

              <h3 className="text-2xl font-bold text-black mb-4 mt-8" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                Why Choose Two Fungis Finishing in {location.city}?
              </h3>
              
              <p className="text-gray-700 leading-relaxed mb-4" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                We're not just contractors – we're craftsmen who take pride in every detail. Our team brings together Scott Marshall's 20 years of hands-on experience in millwork and finishing carpentry, and Beau Suprun's exceptional eye for detail as a master craftsman and machinist. This combination of experience and precision ensures your project in {location.city} exceeds expectations.
              </p>

              {location.projectTypes && location.projectTypes.length > 0 && (
                <>
                  <h3 className="text-2xl font-bold text-black mb-4 mt-8" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                    Project Types We Serve in {location.city}
                  </h3>
                  <ul className="space-y-2 mb-8">
                    {location.projectTypes.map((project, index) => (
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
                  Working in {location.city}?
                </h3>
                <p className="text-gray-700 mb-4" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                  Invite Two Fungis Finishing to tender your next commercial or multifamily project. $5 million liability coverage, WorkSafeBC compliant, and ready to support GCs and developers across British Columbia.
                </p>
                <div className="grid sm:grid-cols-2 gap-3 mb-4">
                  <a href="tel:778-268-4920" className="flex items-center font-semibold text-sm" style={{ color: '#228B22' }} data-testid="loc-call-scott">
                    <Phone size={18} className="mr-2" />
                    778-268-4920 — Scott Marshall
                  </a>
                  <a href="tel:250-327-8202" className="flex items-center font-semibold text-sm" style={{ color: '#228B22' }} data-testid="loc-call-beau">
                    <Phone size={18} className="mr-2" />
                    250-327-8202 — Beau Suprun
                  </a>
                </div>
                <a href="mailto:inbox@twofungis.ca" className="flex items-center font-semibold text-sm" style={{ color: '#228B22' }}>
                  <Mail size={18} className="mr-2" />
                  inbox@twofungis.ca
                </a>
                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => scrollToSection('contact')}
                    className="inline-flex items-center gap-2 text-white px-5 py-2.5 rounded-md text-sm font-semibold"
                    style={{ backgroundColor: '#228B22' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor='#1e7b1e'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor='#228B22'}
                  >
                    Invite Us to Tender <ChevronRight size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrequalOpen(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-semibold border-2"
                    style={{ borderColor: '#228B22', color: '#228B22', backgroundColor: 'transparent' }}
                  >
                    Request Prequalification Package
                  </button>
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

      <PrequalificationModal open={prequalOpen} onClose={() => setPrequalOpen(false)} />
    </div>
  );
};

export default LocationPage;

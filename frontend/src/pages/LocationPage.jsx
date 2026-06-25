import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { locations } from '../data/locations';
import Header from '../components/Header';
import Services from '../components/Services';
import Portfolio from '../components/Portfolio';
import Contact from '../components/Contact';
import Footer from '../components/Footer';
import TradeOSBanner from '../components/TradeOSBanner';
import { Button } from '../components/ui/button';
import { MapPin, Phone, Mail, CheckCircle2 } from 'lucide-react';

// Determine which founder primarily covers a given region within the Okanagan
const getPrimaryContact = (region) => {
  const r = (region || '').toLowerCase();
  // Scott Marshall — South Okanagan (Penticton, Summerland, Oliver, Osoyoos, Okanagan Falls)
  if (r.includes('south')) {
    return {
      name: 'Scott Marshall',
      phone: '778-268-4920',
      phoneHref: 'tel:778-268-4920',
      area: 'Penticton & South Okanagan',
    };
  }
  // Beau Suprun — Central / North Okanagan (Kelowna, West Kelowna, Lake Country, Peachland, Vernon)
  return {
    name: 'Beau Suprun',
    phone: '250-327-8202',
    phoneHref: 'tel:250-327-8202',
    area: 'Kelowna & Central / North Okanagan',
  };
};

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
  const primary = location ? getPrimaryContact(location.region) : null;

  useEffect(() => {
    if (location) {
      const title = `${location.city} Finish Carpentry & Architectural Millwork | Two Fungis Finishing | Okanagan BC`;
      const desc = `Two Fungis Finishing — ${location.city}'s commercial finish carpentry, architectural millwork, doors & hardware, multi-family and deficiency completion specialists. ${location.description} Free quotes. Call ${primary.name} at ${primary.phone}.`;
      const url = `https://twofungis.ca/locations/${location.slug}`;
      const keywords = `finish carpentry ${location.city}, architectural millwork ${location.city}, doors and hardware ${location.city}, multi-family construction ${location.city}, commercial interiors ${location.city}, deficiency completion ${location.city}, tenant improvements ${location.city}, finishing contractor ${location.region}, Two Fungis Finishing ${location.city}, Two Fungis ${location.city}, finish carpenter Okanagan`;

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

      // Per-location JSON-LD (LocalBusiness)
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
        description: desc,
        url,
        telephone: `+1-${primary.phone}`,
        email: 'inbox@twofungis.ca',
        priceRange: '$$',
        address: {
          '@type': 'PostalAddress',
          addressLocality: location.city,
          addressRegion: 'BC',
          addressCountry: 'CA',
        },
        areaServed: { '@type': 'City', name: location.city },
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
  }, [location, primary]);

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
                  Interior Finishing in <span className="text-red-600">{location.city}</span>
                </h1>
              </div>
            </div>
            
            <p className="text-xl sm:text-2xl text-gray-300 mb-6" style={{ fontFamily: 'Open Sans, sans-serif' }}>
              {location.description}
            </p>

            <div className="flex flex-wrap gap-3 justify-center mb-8 text-gray-400">
              <span className="flex items-center gap-2">
                <CheckCircle2 size={20} style={{ color: '#228B22' }} />
                20+ Years Combined Experience
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
              <a
                href={primary.phoneHref}
                className="inline-flex items-center justify-center gap-2 text-white px-8 py-4 text-lg font-semibold rounded-md transition-colors"
                style={{ backgroundColor: '#228B22' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor='#1e7b1e'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor='#228B22'}
                data-testid="primary-call-btn"
              >
                <Phone size={20} />
                Call {primary.name}: {primary.phone}
              </a>
              <Button
                onClick={() => scrollToSection('contact')}
                className="text-white px-8 py-6 text-lg font-semibold"
                style={{ backgroundColor: '#dc2626' }}
                onMouseEnter={(e) => e.target.style.backgroundColor='#b91c1c'}
                onMouseLeave={(e) => e.target.style.backgroundColor='#dc2626'}
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

            {/* Local Primary Contact Caption */}
            <p className="mt-4 text-sm text-gray-400" style={{ fontFamily: 'Open Sans, sans-serif' }}>
              Your local contact for {location.city}: <span className="font-semibold text-white">{primary.name}</span> — {primary.area}
            </p>
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
                Premier Interior Finishing Services in {location.city}, {location.region}
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
                  <a href={primary.phoneHref} className="flex items-center font-semibold" style={{ color: '#228B22' }}>
                    <Phone size={20} className="mr-2" />
                    {primary.phone} — {primary.name}
                  </a>
                  <a href="mailto:inbox@twofungis.ca" className="flex items-center font-semibold" style={{ color: '#228B22' }}>
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

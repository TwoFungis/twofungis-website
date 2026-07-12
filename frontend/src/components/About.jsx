import React from 'react';

const About = () => {
  return (
    <section id="about" className="py-12 bg-white scroll-mt-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="flex flex-col items-center justify-center gap-3 mb-4">
              <img src="https://customer-assets.emergentagent.com/job_okanagan-interiors/artifacts/x3dcmfph_image%20%281%29.png" alt="Two Fungis Finishing" className="h-20 md:h-24 w-auto" />
              <h2 className="text-4xl sm:text-5xl font-bold text-black" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                About <span className="text-red-600">Two Fungis Finishing</span>
              </h2>
            </div>
            <div className="w-24 h-1 bg-red-600 mx-auto mb-6"></div>
            <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto" style={{ fontFamily: 'Open Sans, sans-serif' }}>
              A commercial and multifamily finishing contractor supporting general contractors, developers and homeowners on projects across British Columbia.
            </p>
          </div>

          {/* Story */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-bold text-black mb-6" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                Our Approach
              </h3>
              <p className="text-gray-700 mb-4 leading-relaxed" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                Two Fungis Finishing works alongside developers, general contractors and construction managers to deliver finish carpentry, architectural millwork, doors &amp; hardware, deficiency completion and interior finishing on commercial, multifamily and select residential projects across British Columbia.
              </p>
              <p className="text-gray-700 mb-4 leading-relaxed" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                Established in 2017 and led by Scott Marshall and Beau Suprun, the company is built around a straightforward standard — clear communication, careful scope review, transparent inclusions, dependable scheduling and clean documented closeout. We take the time to understand each project, integrate with the site team, and finish a building that reflects well on everyone who worked on it.
              </p>
              <p className="text-gray-700 mb-4 leading-relaxed" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                Our crews carry $5 million liability coverage, are WorkSafeBC compliant, and operate with the documentation and coordination that commercial and multifamily work requires. We treat every client&apos;s reputation as if it were our own, and we&apos;d rather earn long-term relationships with a handful of well-run builders than chase volume.
              </p>
              <p className="text-gray-700 leading-relaxed" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                If you are tendering a project in BC and want a finishing subcontractor that takes scope, schedule and communication seriously — we would like to be on your bid list.
              </p>
            </div>
            <div className="relative">
              <img
                src="https://customer-assets.emergentagent.com/job_find-twofungis/artifacts/4kayqebz_20221022_100810.jpg"
                alt="Multifamily kitchen finishing by Two Fungis Finishing — British Columbia"
                className="rounded-lg shadow-2xl w-full h-auto object-cover"
              />
              <div className="absolute -bottom-6 -left-6 text-white p-6 rounded-lg shadow-xl" style={{ backgroundColor: '#228B22' }}>
                <p className="text-4xl font-bold" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>$5M</p>
                <p className="text-sm" style={{ fontFamily: 'Open Sans, sans-serif' }}>Liability Coverage</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
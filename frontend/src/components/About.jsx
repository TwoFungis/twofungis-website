import React from 'react';

const About = () => {
  return (
    <section id="about" className="py-12 bg-white">
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
            <p className="text-lg text-gray-600 max-w-3xl mx-auto" style={{ fontFamily: 'Open Sans, sans-serif' }}>
              We are a British Columbia finishing contractor — supporting commercial and multifamily projects throughout Southern BC. Two Fungis Finishing serves clients from Vancouver and the Fraser Valley through the Okanagan to Vancouver Island, specializing in commercial finish carpentry, architectural millwork, doors &amp; hardware, multi-family construction and deficiency completion.
            </p>
          </div>

          {/* Story */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-bold text-black mb-6" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                Our Story
              </h3>              <p className="text-gray-700 mb-4 leading-relaxed" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                Established in 2017, Two Fungis Finishing brings over 20 years of combined hands-on expertise to every project. Founded by Scott Marshall and Beau Suprun, our company represents the perfect union of experience and precision craftsmanship.
              </p>
              <p className="text-gray-700 mb-4 leading-relaxed" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                Scott Marshall has built a distinguished career spanning 15 years in millwork, finishing carpentry, cabinet installation, and flooring. His expertise ensures exceptional craftsmanship across all project types.
              </p>
              <p className="text-gray-700 mb-4 leading-relaxed" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                Beau Suprun, master craftsman, exceptional carpenter, and machinist, brings an unparalleled eye for detail and perfection that is second to none in the finishing world. With extensive experience in multi-unit finishing management and installation, his meticulous approach guarantees flawless execution on every project.
              </p>
              <p className="text-gray-700 mb-4 leading-relaxed" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                With our $5 million liability insurance and proven track record, we continue to secure commercial finish carpentry, multi-family and architectural millwork contracts throughout British Columbia. Our commitment to excellence and professional service has made us a trusted partner for developers, GCs, and homeowners alike.
              </p>
              <p className="text-gray-700 leading-relaxed" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                Together, Scott and Beau lead a team dedicated to precision craftsmanship and reliable schedule performance. From multi-family developments and commercial tenant improvements to bespoke architectural millwork, our combined Okanagan expertise ensures every detail is executed to perfection.
              </p>
            </div>
            <div className="relative">
              <img
                src="https://customer-assets.emergentagent.com/job_find-twofungis/artifacts/4kayqebz_20221022_100810.jpg"
                alt="Custom kitchen with quartz waterfall island and stainless steel appliances by Two Fungis Finishing"
                className="rounded-lg shadow-2xl w-full h-auto object-cover"
              />
              <div className="absolute -bottom-6 -left-6 text-white p-6 rounded-lg shadow-xl" style={{ backgroundColor: '#228B22' }}>
                <p className="text-4xl font-bold" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>20+</p>
                <p className="text-sm" style={{ fontFamily: 'Open Sans, sans-serif' }}>Years Experience</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
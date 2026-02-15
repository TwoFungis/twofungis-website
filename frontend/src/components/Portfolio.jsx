import React, { useState } from 'react';
import { ZoomIn } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger } from './ui/dialog';

const Portfolio = () => {
  const projects = [
    {
      image: 'https://customer-assets.emergentagent.com/job_okanagan-interiors/artifacts/xy0jgjk8_IMG_20191217_163428.jpg',
      title: 'Residential Staircase & Railing',
      category: 'Residential'
    },
    {
      image: 'https://customer-assets.emergentagent.com/job_okanagan-interiors/artifacts/oce3ehrv_20211103_163344.jpg',
      title: 'Custom Millwork & Cabinetry',
      category: 'Residential'
    },
    {
      image: 'https://customer-assets.emergentagent.com/job_okanagan-interiors/artifacts/v2glu48u_IMG_20200403_134102.jpg',
      title: 'Floating Staircase Construction',
      category: 'Multi-Unit'
    },
    {
      image: 'https://customer-assets.emergentagent.com/job_okanagan-interiors/artifacts/mme4t8iz_20211023_172224.jpg',
      title: 'Kitchen Cabinet Installation',
      category: 'Residential'
    },
    {
      image: 'https://customer-assets.emergentagent.com/job_okanagan-interiors/artifacts/bzus3wmb_Messenger_creation_36C70082-8A8C-4DDB-AD6E-ECD1C9EA46D2.jpeg',
      title: 'Custom Wall Paneling & Trim Work',
      category: 'Residential'
    },
    {
      image: 'https://customer-assets.emergentagent.com/job_okanagan-interiors/artifacts/futuvp4y_IMG_20200211_140913.jpg',
      title: 'Diagonal Wood Feature Wall',
      category: 'Commercial'
    },
    {
      image: 'https://customer-assets.emergentagent.com/job_okanagan-interiors/artifacts/j7f9wan6_IMG_20191217_163614.jpg',
      title: 'Custom Wood Staircase',
      category: 'Residential'
    },
    {
      image: 'https://customer-assets.emergentagent.com/job_okanagan-interiors/artifacts/38llggo5_Messenger_creation_93E07220-5F16-45F6-A018-C089F70AADD0.jpeg',
      title: 'Coffered Ceiling with Crown Molding',
      category: 'Residential'
    },
    {
      image: 'https://customer-assets.emergentagent.com/job_okanagan-interiors/artifacts/fu9jwkgc_20211011_153642.jpg',
      title: 'White Kitchen Cabinet Installation',
      category: 'Residential'
    },
    {
      image: 'https://customer-assets.emergentagent.com/job_okanagan-interiors/artifacts/w08mfqcc_IMG_20191219_205008.jpg',
      title: 'Modern Stair Installation',
      category: 'Commercial'
    },
    {
      image: 'https://customer-assets.emergentagent.com/job_okanagan-interiors/artifacts/04skro1o_Messenger_creation_A9C50B15-98C6-4DCE-BE37-88B3200992E0.jpeg',
      title: 'Wooden Staircase Railing Detail',
      category: 'Residential'
    },
    {
      image: 'https://customer-assets.emergentagent.com/job_okanagan-interiors/artifacts/n3k3qxu3_20220128_182344.jpg',
      title: 'Modern Bathroom Vanity & Vessel Sinks',
      category: 'Residential'
    },
    {
      image: 'https://customer-assets.emergentagent.com/job_okanagan-interiors/artifacts/5od2mhbp_IMG_20200403_115211.jpg',
      title: 'Custom Feature Wall',
      category: 'Commercial'
    },
    {
      image: 'https://customer-assets.emergentagent.com/job_okanagan-interiors/artifacts/m2uclkhb_Messenger_creation_373AE9DE-1CB6-47BB-9D91-B5F2182586E7.jpeg',
      title: 'Coffered Ceiling Craftsmanship',
      category: 'Residential'
    },
    {
      image: 'https://customer-assets.emergentagent.com/job_okanagan-interiors/artifacts/w5ytwuxa_IMG_20191217_163454.jpg',
      title: 'Staircase Detail & Craftsmanship',
      category: 'Residential'
    },
    {
      image: 'https://customer-assets.emergentagent.com/job_okanagan-interiors/artifacts/im4qkioh_Messenger_creation_564A7F58-5188-444E-9369-A57636159BF8.jpeg',
      title: 'Two-Tone Wood Staircase',
      category: 'Multi-Unit'
    },
    {
      image: 'https://customer-assets.emergentagent.com/job_okanagan-interiors/artifacts/xcihx4pi_20220128_182318.jpg',
      title: 'Custom Kitchen Design & Installation',
      category: 'Residential'
    },
    {
      image: 'https://customer-assets.emergentagent.com/job_okanagan-interiors/artifacts/qd4ch2yy_IMG_20190920_102445.jpg',
      title: 'Interior Railing Work',
      category: 'Multi-Unit'
    },
    {
      image: 'https://customer-assets.emergentagent.com/job_okanagan-interiors/artifacts/f44juoiy_IMG_20200312_154654.jpg',
      title: 'Interior Door Installation',
      category: 'Residential'
    },
    {
      image: 'https://customer-assets.emergentagent.com/job_okanagan-interiors/artifacts/hc3jy69c_ChatGPT%20Image%20Feb%2014%2C%202026%2C%2007_40_22%20PM.png',
      title: 'Two Fungis Ltd - Premium Craftsmanship',
      category: 'Our Brand'
    }
  ];

  const [selectedImage, setSelectedImage] = useState(null);

  return (
    <section id="portfolio" className="py-20 bg-black">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
              Our <span className="text-red-600">Portfolio</span>
            </h2>
            <div className="w-24 h-1 bg-red-600 mx-auto mb-6"></div>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto" style={{ fontFamily: 'Open Sans, sans-serif' }}>
              Showcasing our commitment to quality craftsmanship and attention to detail
            </p>
          </div>

          {/* Gallery Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, index) => (
              <Dialog key={index}>
                <DialogTrigger asChild>
                  <div
                    className="relative group cursor-pointer overflow-hidden rounded-lg"
                    onClick={() => setSelectedImage(project.image)}
                  >
                    <img
                      src={project.image}
                      alt={project.title}
                      className="w-full h-80 object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    {/* Watermark - MORE VISIBLE */}
                    <div className="absolute bottom-2 right-2 opacity-60 group-hover:opacity-80 transition-opacity">
                      <img
                        src="https://customer-assets.emergentagent.com/job_okanagan-interiors/artifacts/hc3jy69c_ChatGPT%20Image%20Feb%2014%2C%202026%2C%2007_40_22%20PM.png"
                        alt="Two Fungis Ltd"
                        className="h-8 w-auto"
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute bottom-0 left-0 right-0 p-6">
                        <span className="inline-block px-3 py-1 bg-red-600 text-white text-sm font-semibold rounded-full mb-3">
                          {project.category}
                        </span>
                        <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                          {project.title}
                        </h3>
                      </div>
                      <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm p-3 rounded-full">
                        <ZoomIn className="text-white" size={20} />
                      </div>
                    </div>
                  </div>
                </DialogTrigger>
                <DialogContent className="max-w-4xl w-full bg-black border-red-600">
                  <img
                    src={project.image}
                    alt={project.title}
                    className="w-full h-auto rounded-lg"
                  />
                  <div className="mt-4">
                    <span className="inline-block px-3 py-1 bg-red-600 text-white text-sm font-semibold rounded-full mb-2">
                      {project.category}
                    </span>
                    <h3 className="text-2xl font-bold text-white" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                      {project.title}
                    </h3>
                  </div>
                </DialogContent>
              </Dialog>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Portfolio;
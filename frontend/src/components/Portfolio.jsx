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
      image: 'https://customer-assets.emergentagent.com/job_okanagan-interiors/artifacts/j7f9wan6_IMG_20191217_163614.jpg',
      title: 'Custom Wood Staircase',
      category: 'Residential'
    },
    {
      image: 'https://customer-assets.emergentagent.com/job_okanagan-interiors/artifacts/w08mfqcc_IMG_20191219_205008.jpg',
      title: 'Modern Stair Installation',
      category: 'Commercial'
    },
    {
      image: 'https://customer-assets.emergentagent.com/job_okanagan-interiors/artifacts/qd4ch2yy_IMG_20190920_102445.jpg',
      title: 'Interior Railing Work',
      category: 'Multi-Unit'
    },
    {
      image: 'https://customer-assets.emergentagent.com/job_okanagan-interiors/artifacts/oce3ehrv_20211103_163344.jpg',
      title: 'Custom Millwork & Cabinetry',
      category: 'Residential'
    },
    {
      image: 'https://customer-assets.emergentagent.com/job_okanagan-interiors/artifacts/mme4t8iz_20211023_172224.jpg',
      title: 'Kitchen Cabinet Installation',
      category: 'Residential'
    },
    {
      image: 'https://customer-assets.emergentagent.com/job_okanagan-interiors/artifacts/v2glu48u_IMG_20200403_134102.jpg',
      title: 'Floating Staircase Construction',
      category: 'Multi-Unit'
    },
    {
      image: 'https://customer-assets.emergentagent.com/job_okanagan-interiors/artifacts/5od2mhbp_IMG_20200403_115211.jpg',
      title: 'Custom Feature Wall',
      category: 'Commercial'
    },
    {
      image: 'https://customer-assets.emergentagent.com/job_okanagan-interiors/artifacts/f44juoiy_IMG_20200312_154654.jpg',
      title: 'Interior Door Installation',
      category: 'Residential'
    },
    {
      image: 'https://customer-assets.emergentagent.com/job_okanagan-interiors/artifacts/pynvzdye_IMG_20210223_223943_967.jpg',
      title: 'Modern Kitchen Renovation',
      category: 'Residential'
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
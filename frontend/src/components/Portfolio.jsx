import React, { useState, useEffect, useCallback } from 'react';
import { Plus, X, ChevronLeft, ChevronRight } from 'lucide-react';

// Portfolio images — alt text is for accessibility & SEO only (not shown on the card)
const photos = [
  { src: 'https://customer-assets.emergentagent.com/job_find-twofungis/artifacts/uj0cmrlu_scott16.jpg',          alt: 'Custom stair landing & railing — Two Fungis Finishing' },
  { src: 'https://customer-assets.emergentagent.com/job_find-twofungis/artifacts/3uhpnl5a_scott15.jpg',          alt: 'Custom kitchen with granite island & shaker cabinetry — Two Fungis Finishing' },
  { src: 'https://customer-assets.emergentagent.com/job_find-twofungis/artifacts/010ubehg_scott12.jpeg',         alt: 'Custom coffered ceiling detail — Two Fungis Finishing' },
  { src: 'https://customer-assets.emergentagent.com/job_find-twofungis/artifacts/bkyow0po_scott2.jpg',           alt: 'Modern kitchen with quartz waterfall island — Two Fungis Finishing' },
  { src: 'https://customer-assets.emergentagent.com/job_find-twofungis/artifacts/ih07eflu_20211006_132459.jpg',  alt: 'Custom interior stairs & railing — Two Fungis Finishing' },
  { src: 'https://customer-assets.emergentagent.com/job_find-twofungis/artifacts/9vmtdeai_beau1.jpg',            alt: 'Built-in entertainment wall millwork — Two Fungis Finishing' },
  { src: 'https://customer-assets.emergentagent.com/job_find-twofungis/artifacts/34afn4gi_20221024_141952.jpg',  alt: 'Custom bathroom vanity with vessel sinks — Two Fungis Finishing' },
  { src: 'https://customer-assets.emergentagent.com/job_find-twofungis/artifacts/5jjo8hpb_20220909_152047.jpg',  alt: 'Stair build with custom posts &amp; handrails — Two Fungis Finishing' },
  { src: 'https://customer-assets.emergentagent.com/job_find-twofungis/artifacts/oglnnseg_20220114_223756.jpg',  alt: 'White stair railing with iron spindles — Two Fungis Finishing' },
  { src: 'https://customer-assets.emergentagent.com/job_find-twofungis/artifacts/wl2hjvkn_beau10.jpg',           alt: 'Custom butler pantry &amp; wine cabinetry — Two Fungis Finishing' },
];

const THUMB_LOGO = 'https://customer-assets.emergentagent.com/job_okanagan-interiors/artifacts/x3dcmfph_image%20%281%29.png';

const Portfolio = () => {
  const [activeIndex, setActiveIndex] = useState(null);
  const isOpen = activeIndex !== null;

  const close = useCallback(() => setActiveIndex(null), []);
  const next  = useCallback(() => setActiveIndex((i) => (i + 1) % photos.length), []);
  const prev  = useCallback(() => setActiveIndex((i) => (i - 1 + photos.length) % photos.length), []);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, close, next, prev]);

  return (
    <section id="portfolio" className="py-12 bg-black scroll-mt-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="flex flex-col items-center justify-center gap-3 mb-4">
              <img src={THUMB_LOGO} alt="Two Fungis Finishing" className="h-20 md:h-24 w-auto" />
              <h2 className="text-4xl sm:text-5xl font-bold text-white" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                Our <span className="text-red-600">Projects</span>
              </h2>
            </div>
            <div className="w-24 h-1 bg-red-600 mx-auto mb-6"></div>
          </div>

          {/* Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {photos.map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveIndex(i)}
                className="group relative block w-full aspect-square overflow-hidden rounded-lg bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-red-600"
                data-testid={`project-${i}`}
                aria-label={`Open project image ${i + 1}`}
              >
                <img
                  src={p.src}
                  alt={p.alt}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {/* Subtle hover wash */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />

                {/* Persistent logo + plus badge (bottom-right) */}
                <div className="absolute bottom-3 right-3 flex items-center gap-1.5 transition-all duration-300 group-hover:scale-110 group-hover:drop-shadow-[0_0_12px_rgba(34,139,34,0.85)]">
                  <img
                    src={THUMB_LOGO}
                    alt=""
                    className="h-10 md:h-12 w-auto drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)]"
                  />
                  <span
                    className="flex items-center justify-center w-6 h-6 rounded-full text-white text-lg font-bold leading-none"
                    style={{ backgroundColor: '#228B22' }}
                  >
                    <Plus size={14} strokeWidth={3} />
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[80] bg-black/95 flex items-center justify-center p-4 sm:p-8"
          onClick={close}
          data-testid="lightbox"
        >
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); close(); }}
            className="absolute top-4 right-4 text-white p-2 rounded-full hover:bg-white/10"
            aria-label="Close"
            data-testid="lightbox-close"
          >
            <X size={28} />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-2 sm:left-6 text-white p-2 rounded-full hover:bg-white/10"
            aria-label="Previous image"
            data-testid="lightbox-prev"
          >
            <ChevronLeft size={36} />
          </button>
          <img
            src={photos[activeIndex].src}
            alt={photos[activeIndex].alt}
            className="max-h-[88vh] max-w-[92vw] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-2 sm:right-6 text-white p-2 rounded-full hover:bg-white/10"
            aria-label="Next image"
            data-testid="lightbox-next"
          >
            <ChevronRight size={36} />
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm" style={{ fontFamily: 'Open Sans, sans-serif' }}>
            {activeIndex + 1} / {photos.length}
          </div>
        </div>
      )}
    </section>
  );
};

export default Portfolio;

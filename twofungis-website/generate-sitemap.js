const { locations } = require('../src/data/locations');

const generateSitemap = () => {
  const baseUrl = 'https://twofungis.ca';
  const today = new Date().toISOString().split('T')[0];
  
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Homepage -->
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
`;

  // Add location pages
  locations.forEach(location => {
    sitemap += `  <!-- ${location.city} -->
  <url>
    <loc>${baseUrl}/locations/${location.slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
`;
  });

  sitemap += `</urlset>`;
  
  return sitemap;
};

console.log(generateSitemap());

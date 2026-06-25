// British Columbia service area — Two Fungis Finishing
// Local SEO targeting via dedicated municipal pages; one consistent BC-wide identity.
const make = (city, slug, region, lead) => ({
  city,
  slug,
  region,
  description: `${lead} Two Fungis Finishing supports commercial and multifamily projects in ${city} with finish carpentry, architectural millwork, doors & hardware and deficiency completion.`,
  services: ['Commercial finish carpentry', 'Architectural millwork', 'Doors & hardware', 'Multi-family construction', 'Deficiency completion', 'Tenant improvements'],
  projectTypes: ['Multi-family residential', 'Commercial interiors', 'Institutional projects', 'Tenant improvements']
});

export const locations = [
  // ─── Lower Mainland ─────────────────────────────────────────
  make('Vancouver',      'vancouver',      'Lower Mainland', 'Vancouver finishing contractor serving developers, GCs and construction managers across Metro Vancouver.'),
  make('Burnaby',        'burnaby',        'Lower Mainland', 'Burnaby commercial and multifamily finishing — supporting Lower Mainland general contractors and developers.'),
  make('Richmond',       'richmond',       'Lower Mainland', 'Richmond architectural millwork, finish carpentry and tenant improvement specialists.'),
  make('Surrey',         'surrey',         'Lower Mainland', 'Surrey finish carpentry, multifamily construction support and commercial fit-outs.'),

  // ─── Fraser Valley ──────────────────────────────────────────
  make('Langley',        'langley',        'Fraser Valley',  'Langley commercial finish carpentry and architectural millwork for Fraser Valley developments.'),
  make('Abbotsford',     'abbotsford',     'Fraser Valley',  'Abbotsford finishing contractor — multifamily, commercial and institutional finishing across the Fraser Valley.'),
  make('Chilliwack',     'chilliwack',     'Fraser Valley',  'Chilliwack finish carpentry, doors & hardware, and deficiency completion for commercial and multifamily projects.'),

  // ─── Okanagan / Thompson ────────────────────────────────────
  make('Kelowna',        'kelowna',        'Okanagan',       'Kelowna commercial finishing contractor — multifamily, hospitality, institutional and tenant improvement finishing.'),
  make('West Kelowna',   'west-kelowna',   'Okanagan',       'West Kelowna finish carpentry, architectural millwork and multifamily finishing.'),
  make('Penticton',      'penticton',      'Okanagan',       'Penticton finish carpentry, architectural millwork and multifamily project finishing.'),
  make('Summerland',     'summerland',     'Okanagan',       'Summerland commercial finish carpentry, architectural millwork and deficiency completion.'),
  make('Lake Country',   'lake-country',   'Okanagan',       'Lake Country commercial and multifamily finishing services.'),
  make('Vernon',         'vernon',         'Okanagan',       'Vernon finish carpentry, architectural millwork and multifamily construction support.'),
  make('Oliver',         'oliver',         'Okanagan',       'Oliver finish carpentry, doors & hardware and commercial finishing.'),
  make('Osoyoos',        'osoyoos',        'Okanagan',       'Osoyoos finish carpentry, architectural millwork and hospitality finishing.'),
  make('Okanagan Falls', 'okanagan-falls', 'Okanagan',       'Okanagan Falls commercial and residential finishing services.'),
  make('Kamloops',       'kamloops',       'Thompson',       'Kamloops commercial finish carpentry, multifamily construction support and tenant improvements.'),
  make('Salmon Arm',     'salmon-arm',     'Thompson',       'Salmon Arm commercial finishing — finish carpentry, architectural millwork and deficiency completion.'),

  // ─── Vancouver Island ───────────────────────────────────────
  make('Victoria',       'victoria',       'Vancouver Island', 'Victoria finish carpentry, architectural millwork and commercial interior finishing.'),
  make('Langford',       'langford',       'Vancouver Island', 'Langford commercial and multifamily finishing across the West Shore.'),
  make('Nanaimo',        'nanaimo',        'Vancouver Island', 'Nanaimo finish carpentry, architectural millwork and multifamily construction services.'),
  make('Duncan',         'duncan',         'Vancouver Island', 'Duncan and Cowichan Valley commercial finish carpentry and deficiency completion.'),
  make('Courtenay',      'courtenay',      'Vancouver Island', 'Courtenay finish carpentry, architectural millwork and multifamily finishing.'),
  make('Campbell River', 'campbell-river', 'Vancouver Island', 'Campbell River commercial and institutional finishing services.'),
  make('Comox',          'comox',          'Vancouver Island', 'Comox Valley commercial finish carpentry and architectural millwork.'),
  make('Parksville',     'parksville',     'Vancouver Island', 'Parksville commercial finishing and architectural millwork.'),
  make('Qualicum Beach', 'qualicum-beach', 'Vancouver Island', 'Qualicum Beach finish carpentry, architectural millwork and hospitality finishing.'),
];

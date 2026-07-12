# TwoFungis.ca — Product Requirements Document

## Original Problem Statement
Marketing website for **Two Fungis Finishing** (twofungis.ca) — a British Columbia commercial and multifamily interior finishing contractor. The site must:
- Position the company as a trusted finishing subcontractor to General Contractors, Developers, Construction Managers and Homeowners across BC.
- Reflect professionalism, honesty, dependability and long-term relationship focus — no sales hype, no clichés, no inflated claims.
- Support tender invitations and prequalification requests via Web3Forms → `inbox@twofungis.ca`.
- Serve strong BC-wide SEO (28 city-specific location pages, dynamic JSON-LD schema, sitemap).
- Retain the intentional "Powered by TradeOS" marketing banner.
- Deploy via Netlify from GitHub `main` (do NOT use Emergent Deploy).

## Architecture (Current)
- **Frontend**: React + Tailwind + shadcn/ui (standalone static site).
- **Hosting**: Netlify auto-deploy from GitHub `main`.
- **Forms**: Web3Forms (access key hardcoded in `PrequalificationModal.jsx`, forwards to `inbox@twofungis.ca`).
- **Backend**: None (removed intentionally during repo separation).

### Folder Layout
```
/app/frontend/
├── public/         # index.html (SEO + JSON-LD), _redirects, sitemap.xml, robots.txt
├── src/components/ # Hero, About, Services, Portfolio, ServiceAreas, WhyChooseUs, Contact, Footer, Header, TradeOSBanner, PrequalificationModal
├── src/pages/      # Home.jsx, LocationPage.jsx
├── src/data/       # locations.js (28 BC cities)
```

## Brand Positioning Standard
- Voice: professional, honest, confident, humble, dependable, solutions-focused, organized, detail-oriented, easy to work with.
- Avoid: sales hype, empty marketing language, contractor clichés, inflated claims, "we're the best" style messaging.
- Primary audience: GCs, Developers, Construction Managers, Homeowners.
- Every page must reassure the reader that Two Fungis Finishing will communicate clearly, take ownership, protect schedules, deliver consistent quality, solve problems professionally, and be a subcontractor worth hiring again.

## Changelog

### Feb 12, 2026 — Brand, Culture & Market Position Audit (COMPLETE)
Refined copy across all components to remove sales hype and align with the brand positioning standard:
- **Hero.jsx** — Refined tagline ("Done Right" → "Done Properly"), rewrote positioning sentence and tagline to remove "removes problems instead of creating them" cliché.
- **About.jsx** — Reframed subtitle and reputation language to emphasize partnership with GCs, developers, homeowners; added "treat every client's reputation as if it were our own".
- **WhyChooseUs.jsx** — Renamed "Relationship-Driven" → "Long-Term Relationships"; "Reliable Scheduling" → "Dependable Scheduling"; "Responsive Communication" → "Proactive Communication"; refined subtitle to reflect audience standards.
- **Services.jsx** — Reframed subtitle around working with GCs/developers/homeowners; rewrote prequalification blurb for clarity and humility.
- **Portfolio.jsx** — Added professional subtitle describing scope.
- **Contact.jsx** — Removed "Fully insured for your peace of mind" cliché; replaced with factual "WorkSafeBC compliant. Documentation and certificates available on request."; softened CTA copy.
- **Footer.jsx** — Tightened company description around GCs, developers and homeowners.
- **LocationPage.jsx** — Major cleanup: removed "unparalleled expertise", "exceeds expectations", "we're not just contractors – we're craftsmen"; replaced with quiet, professional, audience-focused copy about how the team operates.
- All SEO metadata, JSON-LD schema, canonical URLs, heading hierarchy, keywords preserved.

### Prior Completed Work
- Standalone React marketing site (backend removed).
- Rebrand: "Two Fungis Ltd" → "Two Fungis Finishing".
- Dynamic LocationPage.jsx for 28 BC cities with unique JSON-LD.
- Web3Forms integration for prequalification form → inbox@twofungis.ca.
- TradeOSBanner (emerald green, "Launch TradeOS").
- 20-image portfolio with custom lightbox.
- GoDaddy/Netlify DNS & SSL resolution.

## Backlog / Next Actions

### P0 — User Verification & Deploy
- User reviews the updated copy in preview.
- User clicks "Save to GitHub" in Emergent → triggers Netlify auto-deploy.
- Verify Web3Forms end-to-end on live twofungis.ca after deploy.

### P1 — Enhancements
- Add case-study or featured-project sections to LocationPages if content becomes available.
- Consider a "Recent Projects" data structure so specific projects can be linked per city.

### P2 — Backlog
- Additional location pages (beyond current 28) if requested.
- Additional portfolio images / project categories.
- Optional "Capability Statement" PDF download in the Services prequalification block.

## Test Credentials
None (no auth — static site).

## Deployment
- **DO NOT use Emergent Deploy.**
- User pushes to GitHub via Emergent "Save to GitHub".
- Netlify auto-deploys from `main` to twofungis.ca.

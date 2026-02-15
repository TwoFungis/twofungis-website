# Two Fungis Ltd - Portfolio Website PRD

## Original Problem Statement
Build a professional portfolio website for Two Fungis Ltd., a construction company specializing in interior finishing services. The brand colors are red, black, and white with green accents. The site should be deployed to `twofungis.ca` domain.

## User Personas
- **Primary**: Potential residential/commercial clients looking for interior finishing services in British Columbia
- **Secondary**: General contractors and developers seeking subcontractors

## Core Requirements
- Professional portfolio website with brand identity
- Sections: Hero, About Us, Services, Portfolio, Why Choose Us, Contact, Footer
- Color palette: Red (#DC2626), Black, White, Green (#228B22)
- SEO-optimized landing pages for cities in British Columbia
- Mobile-responsive design
- Deployed to `twofungis.ca` via Netlify

## Technical Architecture
- **Frontend**: React with TailwindCSS
- **Routing**: react-router-dom with hash navigation support
- **Hosting**: Netlify (auto-deploys from GitHub)
- **Domain**: twofungis.ca (managed on GoDaddy)

## Implemented Features (as of Dec 2025)
- [x] Homepage with Hero, About, Services, Portfolio, Why Choose Us, Contact sections
- [x] 20+ SEO landing pages for BC cities
- [x] Mobile-responsive design
- [x] Brand colors and typography
- [x] $5M insurance badge
- [x] Scroll-to-top on navigation
- [x] Cross-page navigation (Header/Footer links work from all pages)

## Recent Changes
- **Dec 2025**: Fixed navigation links to work from landing pages
  - Header.jsx: Added useNavigate/useLocation for cross-page navigation
  - Footer.jsx: Updated quicklinks to use absolute paths (/#section)
  - App.js: Enhanced ScrollToTop to handle hash scrolling

## Backlog / Future Tasks
- [ ] Clean up unused /backend directory (optional)
- [ ] Code cleanup for redundant TailwindCSS classes (optional)

## Deployment Workflow
1. Make changes locally
2. Push to GitHub (TwoFungis/twofungis-website)
3. Netlify auto-deploys to twofungis.ca

## Credentials
- GitHub: TwoFungis
- Domain: twofungis.ca (GoDaddy)
- Hosting: Netlify

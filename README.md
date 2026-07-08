# Sovereign Valor Group Website (v2)

Static website for sovereignvalorgroup.com — veteran-led consulting and venture firm.

## What's new in this version
- **Venture Roster section** on the homepage showcasing SVG-built products:
  Devotion After Victory, Vocasa, OpsConduit, Accountability
  Workout App, Lottery Pattern Engine, and Lumira. Edit descriptions/status chips in `index.html`
  (search for `id="ventures"`).
- New brand typography: Cinzel (display) + Public Sans (body) via Google Fonts.
- Uses your actual logo (`assets/logos/svg-logo-mark.png`) with a transparent
  background — in the nav, footer, favicon, and as a hero watermark.
- Accessibility: skip link, visible keyboard focus, reduced-motion support.
- Subtle scroll-reveal animation (pure vanilla JS, no dependencies).

## Files
- `index.html` — homepage (hero, services, Venture Roster, mission band)
- `about.html` — About Us page
- `styles.css` — shared design system
- `assets/logos/svg-logo-mark.png` — eagle emblem, transparent background
- `assets/logos/svg-logo-full.png` — full lockup with wordmark

## Editing the Venture Roster
Each product is an `<article class="venture">` block. To change a status from
"In Development" to live, change `status-dev` → `status-live` and the label
text to `Operational`. To link a venture to its own site, wrap the `<h3>` text
in an `<a href="...">`.

## Deployment
Upload all files (keeping the folder structure) to Vercel, Netlify, Namecheap
hosting, or any static host.

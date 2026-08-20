# Project Status

**Last updated:** 2026-08-20
**Branch:** `main` — rebuild merged and **deployed**
**Deployed commit:** `1d8c089` "Rebuild site from a central venture registry"

---

## TL;DR

**The rebuild is live.** All 16 pages are serving on
`https://sovereignvalorgroup.com`, verified after deploy. Two integrations
(contact form, analytics) are wired but dormant, awaiting IDs.

---

## What is deployed (live right now)

**`https://sovereignvalorgroup.com`** — GitHub Pages, from `main`, via the
`CNAME` file. Repo: `github.com/kendrixjw/svg-website`.

Post-deploy verification (2026-08-20), all returning 200:

`/` · `/services.html` · `/contact.html` · `/about.html` · `/ventures/` ·
7 × `/ventures/<id>.html` · `/privacy.html` · `/terms.html` ·
`/accessibility.html` · `/sitemap.xml` · `/robots.txt`

Confirmed live: correct venture statuses (Beta / Live / Live / In Development ×4),
JSON-LD present, and **no analytics tag emitted** — matching the privacy policy
as written.

**Fixed by this deploy:** the three incorrect venture statuses, including Lumira
no longer being advertised as shipped when it isn't.

---

## What is built and deployed

**16 pages** — home, services, ventures index, 7 venture detail pages, about,
contact, 404, privacy, terms, accessibility — plus `sitemap.xml` and `robots.txt`.

| Area | State |
|---|---|
| Venture registry | ✅ Complete — 7 ventures, single source of truth |
| Build system | ✅ Complete — zero dependencies, self-validating |
| Design system | ✅ Complete — tokens, 4 status states, AA contrast fix |
| Mobile navigation | ✅ Built — ⚠️ verified by source only, not on a device |
| SEO metadata | ✅ Complete — unique titles/descriptions/canonicals/OG per page |
| Structured data | ✅ Complete — Organization + ProfessionalService + WebSite + 7 × SoftwareApplication |
| Internal links | ✅ 646 crawled, 0 broken |
| Outbound venture links | ✅ All 6 verified 200 |

---

## What is stubbed or incomplete

| Item | Current behavior | To finish |
|---|---|---|
| **Contact form — Formspree chosen** | Validates fully, then composes a message into the visitor's mail client. No submission is recorded server-side. | Create a form at formspree.io and paste its endpoint into `formEndpoint` in `data/site.json`, then rebuild. The form switches to background POST with success/failure messaging automatically. |
| **Analytics — GA4 chosen** | Events attached to every CTA, dispatching to `gtag` if present. No tag is emitted, so **nothing is being collected**. | Paste your `G-XXXXXXX` measurement ID into `ga4Id` in `data/site.json` and rebuild. The tag, and the privacy policy's cookie disclosure, appear together. |
| **Legal pages** | Drafts written this session. Accurate to how the site actually behaves (no tracking cookies, GitHub Pages, Google Fonts, mailto contact). | Qualified review before relying on them. |
| **Venture logos** | 3-letter monogram tiles (DAV, OPS, LUM…). | Supply artwork if these should be real logos. |
| **Family Reunion OG card** | Falls back to the generic SVG share image. | Generate a 1200×630 card to match the other six. |
| **Family Reunion name** | Defaulted to "Family Reunion" with "Spades & Bones" as subtitle — **the naming question was never answered**. | Confirm; it's one line in `data/ventures.json`. |
| **Image optimization** | Untouched. `svg-logo-mark.png` is 252 KB for a 50 px slot; `assets/` ≈ 1.4 MB. | Add `sharp` as a build-only devDependency. |

---

## Recommended next tasks

### 1. Activate the two integrations (highest value)
Both are chosen and wired; both need one ID pasted into `data/site.json`,
then `npm run build:site`, commit, push.

```jsonc
"formEndpoint": "https://formspree.io/f/YOUR_ID",   // from formspree.io
"ga4Id": "G-XXXXXXXXXX"                             // from GA4 admin
```

Until then the site has no way to capture a lead beyond email, and no traffic data.

### 2. Check the live site on a phone
The mobile nav is verified by source only — never on a real device. It's now
live, so this is worth doing soon.

### 3. Submit to search
After deploy: verify the property in Google Search Console and submit
`https://sovereignvalorgroup.com/sitemap.xml`. The site has never had a sitemap
or `robots.txt`, so this is the largest single SEO gain available.

### 4. Move ventures onto first-party subdomains
Four ventures still sit on raw `*.vercel.app` slugs — `lumira-kohl` and
`vocasa-seven` read as auto-generated. `awa.sovereignvalorgroup.com` already
proves the pattern works. DNS + Vercel domain settings only; no code, and the
registry makes each URL a one-line update.

### 5. Optimize images
Largest remaining performance item, and it directly affects LCP on every page.

### 6. Housekeeping
`README.md` rewritten and `.nojekyll` added (2026-08-20). Remaining: decide
whether the legacy `sovereign-valor-group-website/` directory should be archived
or deleted — note it holds the only copies of the original logo masters.

---

## Quick reference

```bash
npm run build        # → dist/ (safe preview, gitignored)
npm run preview      # build + serve at localhost:8899
npm run build:site   # → repo root (overwrites the live files)
```

**To change a venture URL, status, or copy:** edit `data/ventures.json` and
rebuild. That single file drives the homepage roster, the ventures index, the
detail page, the footer links, the sitemap, and the JSON-LD.

**Valid statuses:** `Live`, `Beta`, `In Development`, `Coming Soon`. The build
throws on anything else, and on any non-HTTPS venture URL.

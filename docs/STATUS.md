# Project Status

**Last updated:** 2026-08-20
**Branch:** `main` — rebuild merged and **deployed**
**Deployed commit:** `f759697` "Family Reunion is live"

---

## TL;DR

**The rebuild is live.** All 16 pages are serving on
`https://sovereignvalorgroup.com`, verified after deploy. Formspree and GA4 are
both **active**. The mobile-menu bleed-through reported on a real device is
fixed and deployed.

---

## What is deployed (live right now)

**`https://sovereignvalorgroup.com`** — GitHub Pages, from `main`, via the
`CNAME` file. Repo: `github.com/kendrixjw/svg-website`.

Post-deploy verification (2026-08-20), all returning 200:

`/` · `/services.html` · `/contact.html` · `/about.html` · `/ventures/` ·
7 × `/ventures/<id>.html` · `/privacy.html` · `/terms.html` ·
`/accessibility.html` · `/sitemap.xml` · `/robots.txt`

Confirmed live: correct venture statuses (Beta ×1, Live ×3, In Development ×3),
JSON-LD present, GA4 tag emitted on every page, Formspree action on the contact
form, and the privacy policy's analytics disclosure showing alongside the tag.

**Fixed by these deploys:** the three incorrect venture statuses (including Lumira
no longer being advertised as shipped when it isn't), and page content showing
through the open mobile menu over light sections.

---

## What is built and deployed

**16 pages** — home, services, ventures index, 7 venture detail pages, about,
contact, 404, privacy, terms, accessibility — plus `sitemap.xml` and `robots.txt`.

| Area | State |
|---|---|
| Venture registry | ✅ Complete — 7 ventures, single source of truth |
| Build system | ✅ Complete — zero dependencies, self-validating |
| Design system | ✅ Complete — tokens, 4 status states, AA contrast fix |
| Mobile navigation | ✅ Working — bleed-through bug found on device and fixed; re-check on a phone to confirm |
| SEO metadata | ✅ Complete — unique titles/descriptions/canonicals/OG per page |
| Structured data | ✅ Complete — Organization + ProfessionalService + WebSite + 7 × SoftwareApplication |
| Internal links | ✅ 646 crawled, 0 broken |
| Outbound venture links | ✅ All 7 verified 200 |

---

## What is stubbed or incomplete

| Item | Current behavior | To finish |
|---|---|---|
| **Contact form** | ✅ **Live on Formspree** (`/f/xzepyqrj`). Background POST, honeypot, duplicate-submission hardening, 10-minute cooldown, email fallback on failure. | Nothing — but send yourself one real submission to confirm Formspree delivery and complete its first-submission confirmation if it asks. |
| **Analytics** | ✅ **Live on GA4** (`G-XGDL0Z8612`) on all 16 pages. CTA events (`venture_click`, `consultation_click`, `service_click`, `venture_view`, `contact_submit`) dispatch to `gtag`. | Confirm events appear in GA4 Realtime, then verify the property in Search Console and submit the sitemap. |
| **Legal pages** | Drafts written this session. Accurate to how the site actually behaves (no tracking cookies, GitHub Pages, Google Fonts, mailto contact). | Qualified review before relying on them. |
| **Venture logos** | 3-letter monogram tiles (DAV, OPS, LUM…). | Supply artwork if these should be real logos. |
| **Family Reunion OG card** | Falls back to the generic SVG share image. | Generate a 1200×630 card to match the other six. |
| **Family Reunion name** | "Family Reunion" with "Spades & Bones" as subtitle — matches the live app's own title. | Settled. |
| **Image optimization** | Untouched. `svg-logo-mark.png` is 252 KB for a 50 px slot; `assets/` ≈ 1.4 MB. | Add `sharp` as a build-only devDependency. |

---

## Recommended next tasks

### 1. Confirm the integrations end to end
Both are live and verified in the markup. Still worth doing yourself:
send one real submission through `/contact.html` and confirm it lands in
Formspree, and check GA4 Realtime shows traffic. Formspree may require
confirming the form on its first live submission.

### 2. Check the live site on a phone
The mobile menu bleed-through reported on 2026-08-20 is fixed and deployed;
please re-check on your phone to confirm.

### 3. Submit to search
After deploy: verify the property in Google Search Console and submit
`https://sovereignvalorgroup.com/sitemap.xml`. The site has never had a sitemap
or `robots.txt`, so this is the largest single SEO gain available.

### 4. Move ventures onto first-party subdomains
Five ventures now sit on raw `*.vercel.app` slugs — `lumira-kohl`,
`vocasa-seven`, and `family-reunion-spades-bones` read as auto-generated.
`awa.sovereignvalorgroup.com` already proves the pattern works. DNS + Vercel
domain settings only; no code, and the registry makes each URL a one-line update.

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

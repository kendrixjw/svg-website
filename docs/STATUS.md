# Project Status

**Last updated:** 2026-08-20
**Branch:** `redesign-phase3` (not merged)
**Production branch:** `main` — **unchanged this session**

---

## TL;DR

The rebuilt site is complete and verified in preview, but **nothing has shipped**.
Production still serves the old nine hand-written HTML files. Deploying is a
three-command step once the work is approved.

---

## What is deployed (live right now)

**`https://sovereignvalorgroup.com`** — GitHub Pages, from `main`, via the
`CNAME` file. Repo: `github.com/kendrixjw/svg-website`.

The live site is the **pre-rebuild version**: 9 hand-written HTML files with
duplicated navigation, footer, and venture data. It carries three known defects
that the rebuild fixes but which are **still live today**:

| Live defect | Impact |
|---|---|
| Devotion After Victory labeled "In Development" | It's in Beta |
| OpsConduit labeled "In Development" | It's Live |
| Lumira labeled "Live" | It's In Development — **currently advertising a product as shipped when it isn't** |

Also still live: no `robots.txt`, no `sitemap.xml`, no structured data, no
analytics, no mobile menu (nav links wrap), no `/services` or `/contact` page.

---

## What is built but not deployed

On branch `redesign-phase3`, generated into `dist/` (gitignored):

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
| **Contact form** | Validates fully, then composes a message into the visitor's mail client. Functional, but no submission is recorded server-side. | Pick a form service; set `action` on the `<form>` and the mailto handler stands down automatically. |
| **Analytics** | Events are attached to every CTA and dispatch to `gtag`/`va` if present. With no provider installed it **silently no-ops** — no data is being collected. | Install one provider and add its tag; the events start flowing with no markup changes. |
| **Legal pages** | Drafts written this session. Accurate to how the site actually behaves (no tracking cookies, GitHub Pages, Google Fonts, mailto contact). | Qualified review before relying on them. |
| **Venture logos** | 3-letter monogram tiles (DAV, OPS, LUM…). | Supply artwork if these should be real logos. |
| **Family Reunion OG card** | Falls back to the generic SVG share image. | Generate a 1200×630 card to match the other six. |
| **Family Reunion name** | Defaulted to "Family Reunion" with "Spades & Bones" as subtitle — **the naming question was never answered**. | Confirm; it's one line in `data/ventures.json`. |
| **Image optimization** | Untouched. `svg-logo-mark.png` is 252 KB for a 50 px slot; `assets/` ≈ 1.4 MB. | Add `sharp` as a build-only devDependency. |

---

## Recommended next tasks

### 1. Review and ship the rebuild (highest value)
Run `npm run preview`, click through at `http://localhost:8899/`, and check the
site on a phone — that's the one thing not verified. Then:

```bash
npm run build:site     # generate over the live files at the repo root
git add -A && git commit -m "Rebuild site from central venture registry"
git checkout main && git merge redesign-phase3
git push               # GitHub Pages publishes from main
```

Shipping this also corrects the three wrong venture statuses currently live —
including Lumira being advertised as shipped when it isn't.

### 2. Decide the two integrations
Contact form service and analytics platform. Both are one-line changes once
chosen; both are currently the site's only real conversion gaps.

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

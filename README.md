# Sovereign Valor Group Website

Static website for **sovereignvalorgroup.com** — a veteran-owned technology,
consulting, and venture development company.

Generated from a central data registry by a small Node build script. No
framework, no dependencies, no `node_modules`. The generated HTML is committed
to the repo and served directly, so the site keeps working with or without Node.

---

## Quick start

```bash
npm run preview      # build into dist/ and serve at http://localhost:8899
```

That's the whole development loop. Edit data or templates, re-run, refresh.

---

## How it works

```
data/ventures.json    ← the venture registry (single source of truth)
data/site.json        ← nav, footer, services, contact, credibility copy
        ↓
templates/*.html      ← page templates + partials
lib/render.mjs        ← tiny template renderer
        ↓
build.mjs             ← generates every page
        ↓
dist/  (preview)  or  repo root  (production)
```

One venture's URL, status, or copy lives in **exactly one place**. Changing it
updates the homepage roster, the ventures index, that venture's detail page,
the footer links, `sitemap.xml`, and the JSON-LD structured data at once.

---

## Common tasks

### Change a venture's URL, status, or description

Edit `data/ventures.json`, then rebuild. Nothing else to touch.

Valid statuses: `Live`, `Beta`, `In Development`, `Coming Soon`.
The build **fails** on any other value, or on a venture URL that isn't `https://`.

### Add a new venture

Add an object to `data/ventures.json`. It needs at minimum `id`, `name`, `code`
(the 3-letter monogram tile), `category`, `status`, `tagline`, `metaDescription`,
`ogDescription`, `ogImage`, `ogAlt`, `atAGlance`, `cards`, and `closing`.
Use `"url": null` if it isn't published yet — the outbound link is simply omitted.
Copy an existing entry as a starting point.

A detail page, roster rows, footer link, sitemap entry, and `SoftwareApplication`
schema node are all generated automatically.

### Change navigation, footer, or service copy

Edit `data/site.json`.

### Change the design

Edit `src/styles.css`. Design tokens (color, spacing, type scale, status colors)
are the `:root` block at the top.

### Change page structure

Edit the relevant file in `templates/`. Shared chrome lives in
`templates/partials/` — edit the header or footer once, every page updates.

---

## Scripts

| Command | Does |
|---|---|
| `npm run build` | Build into `dist/` — safe, gitignored, doesn't touch live files |
| `npm run preview` | Build, then serve `dist/` at `localhost:8899` |
| `npm run build:site` | **Build over the live files at the repo root.** Deploy step. |
| `npm run check` | Verify the local preview (needs `npm run preview` running) |
| `npm run check:live` | Verify production |

### Verification

`npm run check` is the pre-deploy gate. It exits non-zero on any failure, so it
can front a CI step later. It checks:

- Every sitemap page returns 200, with a matching canonical
- Exactly one `<h1>` per page and no skipped heading levels
- No duplicate titles or meta descriptions across the site
- Every referenced OG image exists
- Every internal link resolves
- JSON-LD parses, and its venture URLs agree with `data/ventures.json`
- Every venture URL in the registry is https and reachable
- WCAG 2.2 AA contrast for all 17 colour pairs, read from `src/styles.css`
- Alt text, landmarks, skip link, form labels, button names, link text,
  and `rel="noopener"` on external links
- `robots.txt`, sitemap wiring, and 404 behavior

Set `VERBOSE=1` to list passing checks too.

It **cannot** verify focus order against visual order, screen-reader
announcement quality, or the mobile menu in real assistive tech. Those stay
manual.

---

## Deployment

The site is hosted on **GitHub Pages**, published from the `main` branch, with
the custom domain set by the `CNAME` file.

```bash
npm run build:site
git add -A
git commit -m "Rebuild site"
git push          # GitHub Pages publishes automatically
```

Deploying is just committing regenerated HTML — there is no CI step and no build
runs on the server.

---

## Project layout

| Path | What |
|---|---|
| `data/` | Content registry — the files you'll edit most |
| `templates/` | Page templates and shared partials |
| `lib/` | Template renderer and inline service icons |
| `src/` | `styles.css` and `site.js` (copied into the build) |
| `build.mjs` | The build |
| `serve.mjs` | Local preview server (development only — never shipped) |
| `assets/` | Logos, favicons, Open Graph share images |
| `docs/` | `CHANGELOG.md` and `STATUS.md` — current state and open work |
| `dist/` | Build output. Gitignored. |

Generated HTML (`index.html`, `about.html`, `ventures/*.html`, …) sits at the
repo root, because that's what GitHub Pages serves. **Don't hand-edit those** —
they're overwritten on the next build. Edit `data/` or `templates/` instead.

---

## Front-end details

- **Type:** Cinzel (display) + Public Sans (body), via Google Fonts
- **Brand:** deep navy, metallic gold, parchment; eagle-and-crown emblem
- **Accessibility:** skip link, visible focus, reduced-motion support, labeled
  form fields, WCAG 2.2 AA contrast targets
- **JavaScript:** one file, vanilla, no dependencies — mobile menu, scroll
  reveal, contact form, analytics event dispatch

See `docs/STATUS.md` for what's currently stubbed and what's next.

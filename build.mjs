#!/usr/bin/env node
/**
 * Sovereign Valor Group — static site build.
 *
 * Reads data/*.json + templates/*.html and writes plain HTML.
 * No dependencies; Node built-ins only. Output is committed to the repo
 * and served by GitHub Pages exactly as before.
 *
 *   node build.mjs              → build into dist/ (safe preview)
 *   node build.mjs --out .      → build in place, over the live site
 */

import { readFile, writeFile, mkdir, readdir, copyFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { render } from "./lib/render.mjs";
import { iconSvg } from "./lib/icons.mjs";

const root = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const outArg = args.indexOf("--out");
const OUT = path.resolve(root, outArg !== -1 ? args[outArg + 1] : "dist");
const IN_PLACE = OUT === root;

const readJson = async (p) => JSON.parse(await readFile(path.join(root, p), "utf8"));
const readTpl = (p) => readFile(path.join(root, "templates", p), "utf8");

/* ---------- Load data ---------- */

const site = await readJson("data/site.json");
const rawVentures = await readJson("data/ventures.json");

const STATUSES = new Set(["Live", "Beta", "In Development", "Coming Soon"]);
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const ventures = rawVentures.map((v) => {
  if (!STATUSES.has(v.status)) {
    throw new Error(`Venture "${v.name}": unknown status "${v.status}". Allowed: ${[...STATUSES].join(", ")}`);
  }
  if (v.url && !v.url.startsWith("https://")) {
    throw new Error(`Venture "${v.name}": url must be https (got "${v.url}")`);
  }
  return {
    ...v,
    statusClass: `status--${slug(v.status)}`,
    isLive: v.status === "Live",
    // "Visit" for shipped products, "Preview" for anything still being built
    visitLabel: v.status === "Live" || v.status === "Beta" ? `Visit ${v.urlLabel ?? v.name}` : "Preview the build",
    href: `/ventures/${v.id}.html`,
  };
});

const services = site.services.map((s) => ({ ...s, iconSvg: iconSvg(s.icon) }));

/* ---------- Structured data ---------- */

function orgJsonLd() {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["Organization", "ProfessionalService"],
        "@id": `${site.origin}/#organization`,
        name: site.name,
        legalName: site.legalName,
        alternateName: site.abbreviation,
        url: `${site.origin}/`,
        logo: `${site.origin}/assets/logos/svg-logo-full.png`,
        image: `${site.origin}/assets/og-image.png`,
        slogan: site.tagline,
        description:
          "Sovereign Valor Group is a veteran-owned technology, consulting, and venture development company. We provide strategic planning, project and program management, systems integration and automation, technical documentation, and product design and development — and we build and operate our own portfolio of digital ventures.",
        email: site.email,
        areaServed: "US",
        knowsAbout: services.map((s) => s.name),
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "Professional Services",
          itemListElement: services.map((s) => ({
            "@type": "Offer",
            itemOffered: { "@type": "Service", name: s.name, description: s.body },
          })),
        },
        owns: ventures.map((v) => ({ "@id": `${site.origin}/ventures/${v.id}.html#product` })),
      },
      {
        "@type": "WebSite",
        "@id": `${site.origin}/#website`,
        url: `${site.origin}/`,
        name: site.name,
        publisher: { "@id": `${site.origin}/#organization` },
        inLanguage: "en-US",
      },
      ...ventures.map((v) => ({
        "@type": "SoftwareApplication",
        "@id": `${site.origin}/ventures/${v.id}.html#product`,
        name: v.productName ? `${v.name}: ${v.productName}` : v.name,
        applicationCategory: v.category,
        description: v.tagline,
        ...(v.url ? { url: v.url } : {}),
        publisher: { "@id": `${site.origin}/#organization` },
        producer: { "@id": `${site.origin}/#organization` },
      })),
    ],
  });
}

/* ---------- Page assembly ---------- */

const partials = {};
for (const f of await readdir(path.join(root, "templates", "partials"))) {
  partials[path.basename(f, ".html")] = await readTpl(path.join("partials", f));
}
const base = await readTpl("base.html");

const pages = [];

function page(p) {
  pages.push(p);
}

const lastUpdated = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

page({
  file: "index.html",
  template: "home.html",
  canonicalPath: "/",
  title: "Sovereign Valor Group | Veteran-Owned Strategy, Technology & Ventures",
  description:
    "Sovereign Valor Group is a veteran-owned technology, consulting, and venture development company. Strategy, program management, systems integration, and a portfolio of digital ventures.",
  ogTitle: "Sovereign Valor Group | Strategy. Technology. Execution.",
  ogDescription: "Veteran-owned consulting and venture studio. Honor in planning. Valor in execution.",
  ogImage: "/assets/og-image.png",
  ogAlt: "Sovereign Valor Group — Honor in planning. Valor in execution.",
  jsonld: orgJsonLd(),
});

page({
  file: "services.html",
  template: "services.html",
  canonicalPath: "/services.html",
  title: "Services | Sovereign Valor Group",
  description:
    "Strategic planning, project and program management, systems integration and automation, technical documentation, product design and development, and veteran-owned venture support.",
  ogTitle: "Services | Sovereign Valor Group",
  ogDescription: "Strategy is only useful when it can be executed. Six capabilities, one standard.",
  ogImage: "/assets/og-image.png",
  ogAlt: "Sovereign Valor Group — Honor in planning. Valor in execution.",
});

page({
  file: "ventures/index.html",
  template: "ventures-index.html",
  canonicalPath: "/ventures/",
  title: "Ventures | Sovereign Valor Group",
  description:
    "The Sovereign Valor Group venture roster — products conceived, designed, and built under the SVG standard, including Devotion After Victory, OpsConduit, Lottery Pattern Engine, Vocasa, the Accountability Workout App, Lumira, and Family Reunion.",
  ogTitle: "Ventures | Sovereign Valor Group",
  ogDescription: "Products built under the SVG standard — the Sovereign Valor Group venture roster.",
  ogImage: "/assets/og-image.png",
  ogAlt: "Sovereign Valor Group — Honor in planning. Valor in execution.",
});

page({
  file: "about.html",
  template: "about.html",
  canonicalPath: "/about.html",
  title: "About Us | Sovereign Valor Group",
  description:
    "Learn about Sovereign Valor Group, a veteran-owned technology, consulting, and venture development company built on discipline, honor, strategy, and execution.",
  ogTitle: "About Us | Sovereign Valor Group",
  ogDescription:
    "A veteran-owned technology, consulting, and venture development company built on discipline, honor, strategy, and execution.",
  ogImage: "/assets/og-image-about.png",
  ogAlt: "About Sovereign Valor Group — built for leaders who value discipline, clarity, and execution.",
});

page({
  file: "contact.html",
  template: "contact.html",
  canonicalPath: "/contact.html",
  title: "Contact | Schedule a Consultation with Sovereign Valor Group",
  description:
    "Start a project with Sovereign Valor Group. Tell us your objective, obstacles, and timeline, and we'll come back with scope, structure, and a realistic path forward.",
  ogTitle: "Contact | Sovereign Valor Group",
  ogDescription: "Tell us what you're building. We'll tell you what it takes to get there.",
  ogImage: "/assets/og-image.png",
  ogAlt: "Sovereign Valor Group — Honor in planning. Valor in execution.",
});

for (const [file, template, title, description] of [
  ["privacy.html", "privacy.html", "Privacy Policy | Sovereign Valor Group", "How Sovereign Valor Group LLC handles information collected through sovereignvalorgroup.com."],
  ["terms.html", "terms.html", "Terms of Use | Sovereign Valor Group", "The terms that govern your use of sovereignvalorgroup.com."],
  ["accessibility.html", "accessibility.html", "Accessibility Statement | Sovereign Valor Group", "Sovereign Valor Group's commitment to keeping sovereignvalorgroup.com usable by everyone, targeting WCAG 2.2 AA."],
]) {
  page({ file, template, canonicalPath: `/${file}`, title, description, data: { lastUpdated } });
}

page({
  file: "404.html",
  template: "404.html",
  canonicalPath: "/404.html",
  title: "Page Not Found | Sovereign Valor Group",
  description: "The page you were looking for could not be found on sovereignvalorgroup.com.",
  noindex: true,
});

for (const v of ventures) {
  page({
    file: `ventures/${v.id}.html`,
    template: "venture.html",
    canonicalPath: `/ventures/${v.id}.html`,
    title: `${v.name} | A Sovereign Valor Group Venture`,
    description: v.metaDescription,
    ogTitle: `${v.name} | A Sovereign Valor Group Venture`,
    ogDescription: v.ogDescription,
    ogImage: v.ogImage,
    ogAlt: v.ogAlt,
    data: { venture: v },
  });
}

async function buildPage(p) {
  const tpl = await readTpl(p.template);
  const ctx = {
    site,
    ventures: ventures.map((v) => ({ ...v, ctaLocation: p.file.replace(/\.html$/, "") })),
    year: new Date().getFullYear(),
    title: p.title,
    description: p.description,
    canonical: `${site.origin}${p.canonicalPath}`,
    ogTitle: p.ogTitle ?? p.title,
    ogDescription: p.ogDescription ?? p.description,
    ogImage: p.ogImage ?? "/assets/og-image.png",
    ogAlt: p.ogAlt ?? site.tagline,
    jsonld: p.jsonld,
    noindex: p.noindex,
    // Inverse flags: the renderer has no {{#unless}}, and these keep the
    // contact copy and the privacy policy honest about what is actually running.
    formFallback: !site.formEndpoint,
    noAnalytics: !site.ga4Id,
    ...p.data,
  };
  // Mark the active nav item for this page
  ctx.site = {
    ...site,
    services,
    nav: site.nav.map((n) => ({ ...n, current: n.href === p.canonicalPath })),
  };

  const body = render(tpl, ctx, partials);
  return render(base, { ...ctx, body }, partials);
}

/* ---------- Sitemap & robots ---------- */

function sitemap(urls) {
  const today = new Date().toISOString().slice(0, 10);
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>\n    <loc>${site.origin}${u.path}</loc>\n    <lastmod>${today}</lastmod>\n    <priority>${u.priority}</priority>\n  </url>`).join("\n")}
</urlset>
`;
}

const robots = `User-agent: *
Allow: /

Sitemap: ${site.origin}/sitemap.xml
`;

/* ---------- Write ---------- */

await mkdir(OUT, { recursive: true });

for (const p of pages) {
  const dest = path.join(OUT, p.file);
  await mkdir(path.dirname(dest), { recursive: true });
  await writeFile(dest, await buildPage(p), "utf8");
  console.log(`  ✓ ${p.file}`);
}

// Everything indexable, straight from the page list — no hand-maintained list to drift.
const sitemapUrls = pages
  .filter((p) => !p.noindex)
  .map((p) => ({
    path: p.canonicalPath,
    priority: p.canonicalPath === "/" ? "1.0" : p.canonicalPath.startsWith("/ventures") ? "0.8" : "0.6",
  }));
await writeFile(path.join(OUT, "sitemap.xml"), sitemap(sitemapUrls), "utf8");
await writeFile(path.join(OUT, "robots.txt"), robots, "utf8");
console.log("  ✓ sitemap.xml, robots.txt");

// styles.css + site.js ship from src/
await copyFile(path.join(root, "src", "styles.css"), path.join(OUT, "styles.css"));
await copyFile(path.join(root, "src", "site.js"), path.join(OUT, "site.js"));
console.log("  ✓ styles.css, site.js");

// For the dist/ preview, mirror static assets so the page renders standalone.
if (!IN_PLACE) {
  for (const asset of ["assets", "favicon.ico", "CNAME", ".nojekyll"]) {
    const from = path.join(root, asset);
    if (!existsSync(from)) continue;
    const to = path.join(OUT, asset);
    await rm(to, { recursive: true, force: true });
    await cp(from, to);
  }
  console.log("  ✓ assets mirrored into preview");
}

async function cp(from, to) {
  const { cp: nodeCp } = await import("node:fs/promises");
  await nodeCp(from, to, { recursive: true });
}

console.log(`\nBuilt ${pages.length} page(s) → ${path.relative(root, OUT) || "."}`);

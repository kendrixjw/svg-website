#!/usr/bin/env node
/**
 * Pre-deploy verification for the Sovereign Valor Group site.
 *
 *   npm run check              → checks the local preview (http://localhost:8899)
 *   npm run check:live         → checks production
 *   node scripts/check.mjs <origin>
 *
 * Exits non-zero if anything fails, so it can gate a deploy.
 *
 * Covers: reachability, canonicals, heading order, metadata uniqueness,
 * OG images, internal links, structured data, robots/sitemap, WCAG AA colour
 * contrast, and the markup-level accessibility checks that can be automated.
 *
 * It cannot check: focus order vs. visual order, screen-reader announcement
 * quality, or the mobile menu in real assistive tech. Those stay manual.
 */

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ORIGIN = (process.argv[2] || "http://localhost:8899").replace(/\/$/, "");

const fail = [], warn = [], pass = [];
const F = (m) => fail.push(m);
const W = (m) => warn.push(m);
const P = (m) => pass.push(m);

const get = async (u) => {
  try {
    const r = await fetch(u, { redirect: "follow" });
    const ct = r.headers.get("content-type") || "";
    const text = /text|xml|json|javascript/.test(ct) ? await r.text() : "";
    return { status: r.status, text };
  } catch (e) {
    return { status: 0, text: "", error: e.message };
  }
};
const attr = (html, re) => { const m = html.match(re); return m ? m[1] : null; };

/* ---------------- colour contrast (from the source stylesheet) ------------- */

const hex = (h) => { h = h.replace("#", ""); if (h.length === 3) h = h.split("").map((c) => c + c).join(""); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)); };
const lum = (rgb) => { const a = rgb.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2]; };
const ratio = (a, b) => { const [x, y] = [lum(hex(a)), lum(hex(b))].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

const css = await readFile(path.join(root, "src", "styles.css"), "utf8");
const tok = (n) => {
  const m = css.match(new RegExp("--" + n + ":\\s*(#[0-9a-fA-F]{3,8})"));
  if (!m) throw new Error(`design token --${n} not found in src/styles.css`);
  return m[1];
};

// Literal colours that appear in the stylesheet but aren't tokenised.
const LIT = { heroText: "#dde6f0", ventureDesc: "#cdd8e4", credSpan: "#4a5a6a", footerBg: "#040b13" };

const PAIRS = [
  ["body text on parchment", tok("slate"), tok("parchment"), 4.5],
  ["headings on parchment", tok("ink"), tok("parchment"), 3],
  ["gold-ink on parchment", tok("gold-ink"), tok("parchment"), 4.5],
  ["gold-ink on white", tok("gold-ink"), tok("white"), 4.5],
  ["credibility body on parchment", LIT.credSpan, tok("parchment"), 4.5],
  ["hero text on ink", LIT.heroText, tok("ink"), 4.5],
  ["venture description on navy", LIT.ventureDesc, tok("navy"), 4.5],
  ["steel on ink", tok("steel"), tok("ink"), 4.5],
  ["steel on footer", tok("steel"), LIT.footerBg, 4.5],
  ["gold-hi on ink", tok("gold-hi"), tok("ink"), 4.5],
  ["white on navy", tok("white"), tok("navy"), 4.5],
  ["Live pill on parchment", tok("status-live"), tok("parchment"), 4.5],
  ["Beta pill on parchment", tok("status-beta"), tok("parchment"), 4.5],
  ["Live pill on navy", tok("status-live-on-dark"), tok("navy"), 4.5],
  ["Beta pill on navy", tok("status-beta-on-dark"), tok("navy"), 4.5],
  ["In-Dev pill on navy", tok("gold-hi"), tok("navy"), 4.5],
  ["primary button text", tok("ink"), tok("gold"), 4.5],
];

for (const [name, fg, bg, need] of PAIRS) {
  const r = ratio(fg, bg);
  r >= need ? P(`contrast ${r.toFixed(2)}:1 — ${name}`) : F(`contrast ${r.toFixed(2)}:1 below ${need} — ${name}`);
}

/* ---------------- sitemap, robots ---------------- */

const sm = await get(`${ORIGIN}/sitemap.xml`);
sm.status === 200 ? P("sitemap.xml reachable") : F(`sitemap.xml -> ${sm.status}`);
const urls = [...sm.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
urls.length ? P(`sitemap lists ${urls.length} URLs`) : F("sitemap lists no URLs");

const rb = await get(`${ORIGIN}/robots.txt`);
rb.status === 200 ? P("robots.txt reachable") : F(`robots.txt -> ${rb.status}`);
if (!/Sitemap:/i.test(rb.text)) F("robots.txt does not reference the sitemap");

// Sitemap URLs are absolute production URLs; map them onto whatever origin we test.
const toOrigin = (u) => u.replace(/^https?:\/\/[^/]+/, ORIGIN);

/* ---------------- per-page checks ---------------- */

const titles = new Map(), descs = new Map(), pages = new Map();

for (const raw of urls) {
  const u = toOrigin(raw);
  const r = await get(u);
  pages.set(u, r);
  if (r.status !== 200) { F(`${u} -> ${r.status}`); continue; }
  const h = r.text;

  const canon = attr(h, /<link rel="canonical" href="([^"]+)"/);
  if (canon !== raw) F(`canonical mismatch on ${u}: expected ${raw}, got ${canon}`);

  const h1s = (h.match(/<h1[\s>]/g) || []).length;
  if (h1s !== 1) F(`${u} has ${h1s} <h1> elements`);

  const levels = [...h.matchAll(/<h([1-6])[\s>]/g)].map((m) => +m[1]);
  for (let i = 1; i < levels.length; i++) {
    if (levels[i] > levels[i - 1] + 1) F(`${u}: heading order jumps h${levels[i - 1]} -> h${levels[i]}`);
  }

  const t = attr(h, /<title>([^<]*)<\/title>/);
  const d = attr(h, /<meta name="description" content="([^"]*)"/);
  if (!t) F(`${u} missing <title>`);
  else if (titles.has(t)) F(`duplicate title: ${u} and ${titles.get(t)}`);
  else titles.set(t, u);
  if (!d) F(`${u} missing meta description`);
  else if (descs.has(d)) F(`duplicate description: ${u} and ${descs.get(d)}`);
  else descs.set(d, u);

  if (!/<html lang="en">/.test(h)) F(`${u} missing lang="en"`);
  if (!/<main\b/.test(h)) F(`${u} missing <main>`);
  if (!/class="skip-link"/.test(h)) F(`${u} missing skip link`);
  if (!/aria-label="Primary"/.test(h)) F(`${u} primary nav has no accessible name`);

  for (const m of h.matchAll(/<img\b[^>]*>/g)) if (!/\balt=/.test(m[0])) F(`${u}: <img> without alt — ${m[0].slice(0, 60)}`);

  for (const m of h.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)) {
    if (!/rel="[^"]*noopener/.test(m[0])) F(`${u}: target="_blank" without rel="noopener"`);
  }

  for (const m of h.matchAll(/<a\b[^>]*>([^<]{1,24})<\/a>/g)) {
    const txt = m[1].trim().toLowerCase().replace(/[^a-z ]/g, "").trim();
    if (["click here", "here", "read more", "more", "learn more", "link"].includes(txt)) {
      F(`${u}: vague link text "${m[1].trim()}"`);
    }
  }

  for (const m of h.matchAll(/<(input|select|textarea)\b[^>]*>/g)) {
    if (/type="hidden"/.test(m[0])) continue;
    const id = (m[0].match(/\bid="([^"]+)"/) || [])[1];
    if (!id) { F(`${u}: form control without id`); continue; }
    if (!new RegExp(`<label[^>]*for="${id}"`).test(h) && !/aria-label=/.test(m[0])) F(`${u}: no label for #${id}`);
  }

  for (const m of h.matchAll(/<button\b[^>]*>([\s\S]*?)<\/button>/g)) {
    if (!m[1].replace(/<[^>]+>/g, "").trim() && !/aria-label=/.test(m[0])) F(`${u}: button without accessible name`);
  }
}
P(`${urls.length} pages fetched and inspected`);

/* ---------------- OG images ---------------- */

const ogs = new Set();
for (const [u, r] of pages) {
  if (r.status !== 200) continue;
  const og = attr(r.text, /property="og:image" content="([^"]+)"/);
  og ? ogs.add(toOrigin(og)) : F(`${u} missing og:image`);
}
for (const img of ogs) {
  const r = await get(img);
  r.status === 200 ? P(`og image ok — ${img.split("/").pop()}`) : F(`og image ${r.status} — ${img}`);
}

/* ---------------- internal links ---------------- */

const links = new Set();
for (const [, r] of pages) {
  if (r.status !== 200) continue;
  for (const m of r.text.matchAll(/href="([^"]+)"/g)) {
    const h = m[1];
    if (h.startsWith("#") || h.startsWith("mailto:")) continue;
    if (/^https?:\/\//.test(h)) { if (h.startsWith("https://sovereignvalorgroup.com")) links.add(toOrigin(h)); continue; }
    links.add(ORIGIN + (h.startsWith("/") ? h : "/" + h));
  }
}
let broken = 0;
for (const u of links) {
  const r = await get(u.split("#")[0]);
  if (r.status !== 200) { F(`broken internal link ${u} -> ${r.status}`); broken++; }
}
P(`${links.size} internal links checked, ${broken} broken`);

/* ---------------- structured data + registry agreement ---------------- */

const ventures = JSON.parse(await readFile(path.join(root, "data", "ventures.json"), "utf8"));
const home = pages.get(`${ORIGIN}/`);
if (home?.status === 200) {
  const ld = attr(home.text, /<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  try {
    const graph = JSON.parse(ld)["@graph"];
    P(`JSON-LD parses — ${graph.length} nodes`);
    const org = graph.find((n) => String(n["@type"]).includes("Organization"));
    org?.owns?.length === ventures.length
      ? P(`Organization owns all ${ventures.length} ventures`)
      : F(`Organization owns ${org?.owns?.length} of ${ventures.length} ventures`);

    const apps = graph.filter((n) => n["@type"] === "SoftwareApplication");
    for (const v of ventures) {
      const node = apps.find((a) => a.name === (v.productName ? `${v.name}: ${v.productName}` : v.name));
      if (!node) { F(`no schema node for venture ${v.name}`); continue; }
      if (v.url && node.url !== v.url) F(`schema url disagrees with registry for ${v.name}`);
    }
    P("schema URLs agree with the venture registry");
  } catch (e) {
    F("JSON-LD did not parse: " + e.message);
  }
}

/* ---------------- venture URLs reachable ---------------- */

for (const v of ventures) {
  if (!v.url) continue;
  if (!v.url.startsWith("https://")) F(`${v.name}: venture URL is not https`);
  const r = await get(v.url);
  r.status === 200 ? P(`venture reachable — ${v.urlLabel}`) : F(`venture ${v.name} -> ${r.status} (${v.url})`);
}

/* ---------------- 404 ---------------- */

const nf = await get(`${ORIGIN}/definitely-not-a-real-page-xyz`);
nf.status === 404 ? P("unknown paths return 404") : W(`unknown path returned ${nf.status}`);
if (nf.text && !/noindex/.test(nf.text)) W("404 page missing noindex");

/* ---------------- report ---------------- */

const verbose = process.env.VERBOSE === "1";
if (verbose) { console.log("\nPASS"); pass.forEach((s) => console.log("  ✓ " + s)); }
if (warn.length) { console.log("\nWARN"); warn.forEach((s) => console.log("  ! " + s)); }
if (fail.length) { console.log("\nFAIL"); fail.forEach((s) => console.log("  ✗ " + s)); }

console.log(`\n${ORIGIN} — ${pass.length} passed, ${warn.length} warnings, ${fail.length} failures`);
if (!verbose && !fail.length) console.log("(set VERBOSE=1 to list everything that passed)");
process.exit(fail.length ? 1 : 0);

/**
 * Inline service icons. Hand-drawn, stroke-based, ~300 bytes each —
 * no icon library, no extra network requests.
 * All use currentColor so they inherit the surrounding text color.
 */

const S = 'fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"';
const wrap = (inner) => `<svg viewBox="0 0 24 24" ${S} aria-hidden="true" focusable="false">${inner}</svg>`;

export const icons = {
  // Strategic Planning — compass
  compass: wrap('<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5 5-2z"/>'),

  // Project & Program Management — gantt / progress chart
  chart: wrap('<path d="M4 5h10M4 12h14M4 19h7"/><path d="M4 3v18"/>'),

  // Systems Integration & Automation — connected nodes
  nodes: wrap('<circle cx="5" cy="6" r="2.2"/><circle cx="19" cy="6" r="2.2"/><circle cx="12" cy="18" r="2.2"/><path d="M7.2 6h9.6M6.3 8l4.5 8M17.7 8l-4.5 8"/>'),

  // Technical Documentation — document with lines
  document: wrap('<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/><path d="M9 12h6M9 16h6"/>'),

  // Product Design & Development — stacked layers
  layers: wrap('<path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5"/>'),

  // Veteran-Owned Venture Support — shield with chevron
  shield: wrap('<path d="M12 3l7 3v6c0 4.4-2.9 8-7 9-4.1-1-7-4.6-7-9V6l7-3z"/><path d="M9 12l3 3 3-4.5"/>'),
};

export function iconSvg(name) {
  return icons[name] ?? "";
}

/**
 * Minimal mustache-style template renderer. Zero dependencies.
 *
 * Supported syntax:
 *   {{ value }}         — HTML-escaped interpolation (dot paths supported)
 *   {{{ value }}}       — raw interpolation, no escaping
 *   {{#if x}}…{{/if}}   — render block when x is truthy
 *   {{#each xs}}…{{/each}} — repeat block, with the item as the new context
 *   {{> partial}}       — include a registered partial, current context
 *
 * Inside #each, the parent context stays reachable — lookup walks the stack
 * outward, so {{site.name}} still resolves from within a venture loop.
 */

const ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => ESCAPES[c]);
}

function lookup(stack, path) {
  if (path === ".") return stack[stack.length - 1];
  const parts = path.split(".");
  for (let i = stack.length - 1; i >= 0; i--) {
    let cur = stack[i];
    let ok = true;
    for (const part of parts) {
      if (cur == null || typeof cur !== "object" || !(part in cur)) { ok = false; break; }
      cur = cur[part];
    }
    if (ok) return cur;
  }
  return undefined;
}

/**
 * Find the matching {{/tag}} for a block opened at `from`, honoring nesting.
 * Returns { inner, after } string offsets.
 */
function matchBlock(tpl, tag, from) {
  const open = new RegExp(`\\{\\{#${tag}\\s+[^}]*\\}\\}`, "g");
  const close = new RegExp(`\\{\\{/${tag}\\}\\}`, "g");
  let depth = 1;
  let i = from;
  while (depth > 0) {
    open.lastIndex = i;
    close.lastIndex = i;
    const o = open.exec(tpl);
    const c = close.exec(tpl);
    if (!c) throw new Error(`Unclosed {{#${tag}}} block`);
    if (o && o.index < c.index) { depth++; i = o.index + o[0].length; }
    else { depth--; i = c.index + c[0].length; if (depth === 0) return { inner: [from, c.index], after: i }; }
  }
  throw new Error(`Unclosed {{#${tag}}} block`);
}

export function render(template, context, partials = {}) {
  const stack = Array.isArray(context) ? [...context] : [context];

  function walk(tpl) {
    let out = "";
    let i = 0;

    while (i < tpl.length) {
      const start = tpl.indexOf("{{", i);
      if (start === -1) { out += tpl.slice(i); break; }
      out += tpl.slice(i, start);

      // Block: #if / #each
      const block = /^\{\{#(if|each)\s+([\w.]+)\}\}/.exec(tpl.slice(start));
      if (block) {
        const [full, kind, path] = block;
        const bodyStart = start + full.length;
        const { inner, after } = matchBlock(tpl, kind, bodyStart);
        const body = tpl.slice(inner[0], inner[1]);
        const value = lookup(stack, path);

        if (kind === "if") {
          if (value) out += walk(body);
        } else {
          for (const item of Array.isArray(value) ? value : []) {
            stack.push(item);
            out += walk(body);
            stack.pop();
          }
        }
        i = after;
        continue;
      }

      // Partial
      const partial = /^\{\{>\s*([\w-]+)\s*\}\}/.exec(tpl.slice(start));
      if (partial) {
        const name = partial[1];
        if (!(name in partials)) throw new Error(`Unknown partial: ${name}`);
        out += walk(partials[name]);
        i = start + partial[0].length;
        continue;
      }

      // Raw interpolation
      const raw = /^\{\{\{\s*([\w.]+)\s*\}\}\}/.exec(tpl.slice(start));
      if (raw) {
        const v = lookup(stack, raw[1]);
        out += v == null ? "" : String(v);
        i = start + raw[0].length;
        continue;
      }

      // Escaped interpolation
      const esc = /^\{\{\s*([\w.]+)\s*\}\}/.exec(tpl.slice(start));
      if (esc) {
        const v = lookup(stack, esc[1]);
        out += v == null ? "" : escapeHtml(v);
        i = start + esc[0].length;
        continue;
      }

      // Not a tag we recognize — emit the braces literally and move on
      out += "{{";
      i = start + 2;
    }

    return out;
  }

  return walk(template);
}

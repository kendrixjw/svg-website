#!/usr/bin/env node
/* Tiny static preview server for dist/. Node built-ins only. */
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "dist");
const PORT = Number(process.env.PORT) || 8899;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".xml": "application/xml",
  ".txt": "text/plain; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

createServer(async (req, res) => {
  try {
    let rel = decodeURIComponent(new URL(req.url, "http://x").pathname);
    let file = path.join(root, rel);
    if (!file.startsWith(root)) { res.writeHead(403).end("Forbidden"); return; }

    try {
      if ((await stat(file)).isDirectory()) file = path.join(file, "index.html");
    } catch {
      // fall through to 404 below
    }

    const body = await readFile(file);
    res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] ?? "application/octet-stream" });
    res.end(body);
  } catch {
    // A response may already be in flight (client abort, partial write) —
    // writing headers again would throw and take the whole server down.
    if (res.headersSent) { res.destroy(); return; }

    // Resolve the body FIRST — writing the status line before a read that
    // can fail is what leaves the response half-open and hanging.
    let body = "Not found";
    let type = "text/plain; charset=utf-8";
    try {
      body = await readFile(path.join(root, "404.html"));
      type = "text/html; charset=utf-8";
    } catch { /* no custom 404 page in this build — plain text is fine */ }

    res.writeHead(404, { "Content-Type": type });
    res.end(body);
  }
})
  .on("clientError", (err, socket) => socket.destroy())
  .listen(PORT, () => console.log(`Preview: http://localhost:${PORT}/`));

// A dev server should never take itself down over one bad request.
process.on("uncaughtException", (err) => console.error("[serve] ignored:", err.message));

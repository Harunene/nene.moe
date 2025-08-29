// Simple build script to inject BASE_URL into index.template.html
// Usage:
//   bun run build --base https://example.com
// or set env:
//   BASE_URL=https://example.com bun run build

import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

function ensureTrailingSlash(url: string): string {
  if (!url) return "";
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

function getBaseUrlFromArgsOrEnv(): string {
  const fromEnv = process.env.BASE_URL?.trim();
  // Cloudflare Pages preview deployments expose CF_PAGES_URL like https://<hash>.<project>.pages.dev
  const fromCf = process.env.CF_PAGES_URL?.trim();
  const fromArgIndex = process.argv.findIndex((v) => v === "--base" || v === "-b");
  const fromArg = fromArgIndex !== -1 ? process.argv[fromArgIndex + 1] : undefined;
  const base = (fromArg ?? fromEnv ?? fromCf ?? "").trim();
  if (!base) {
    console.warn("[build] BASE_URL not provided; leaving absolute URLs empty. Crawlers may not resolve relative OG URLs.");
    console.warn("[build] Tip: set BASE_URL or CF_PAGES_URL (Cloudflare Pages) or use --base");
  }
  return ensureTrailingSlash(base);
}

async function main() {
  const baseUrl = getBaseUrlFromArgsOrEnv();
  const root = resolve(".");
  const templatePath = resolve(root, "index.template.html");
  const outPath = resolve(root, "index.html");

  const template = await readFile(templatePath, "utf8");
  const result = template.replaceAll("%BASE_URL%", baseUrl);
  await writeFile(outPath, result, "utf8");
  console.log(`[build] Wrote ${outPath} with BASE_URL='${baseUrl}'`);
}

main().catch((err) => {
  console.error("[build] Failed:", err);
  process.exit(1);
});



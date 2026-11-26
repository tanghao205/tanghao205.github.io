import { mkdir, copyFile, writeFile, lstat, realpath, rm } from "node:fs/promises";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

export const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const output = join(root, "dist");

// Only these files may enter the website. Never copy the repository wholesale.
export const publicFiles = [
  "index.html",
  "assets/portfolio/style.css",
  "assets/portfolio/main.js",
  "assets/portfolio/contact.js",
  "assets/portfolio/visits.js",
  "assets/portfolio/uf-monogram.svg",
  "assets/portfolio/uiuc-orange.svg",
  "assets/portfolio/contact-config.js",
  "assets/portfolio/favicon.svg",
  "assets/portfolio/ai-mark.svg",
  "assets/portfolio/airport-focus.jpg",
  "assets/portfolio/databricks-logo.svg",
  "assets/portfolio/model-integration.svg",
  "assets/portfolio/battle-trucks.jpg",
  "assets/portfolio/gm-corvette.jpg",
  "assets/portfolio/fonts/dm-sans.woff2",
  "assets/portfolio/fonts/DM-Sans-OFL.txt",
  "images/cifar10.jpg",
  "images/Storm_event.jpg",
  "images/GTD.jpg",
];
export const redirects = {
  about: "about",
  ML: "explorations",
  CC: "explorations",
  DV: "explorations",
  coding: "work",
};
export const generatedFiles = [
  ".nojekyll",
  "404.html",
  "robots.txt",
  "sitemap.xml",
  ...Object.keys(redirects).map((route) => `${route}/index.html`),
];

export async function build() {
  // Refuse junctions/symlinks before clearing this specific generated directory.
  const existing = await lstat(output).catch((error) => {
    if (error.code !== "ENOENT") throw error;
  });
  if (
    existing &&
    (existing.isSymbolicLink() ||
      (await realpath(output)) !== join(await realpath(root), "dist"))
  ) {
    throw new Error("Refusing to replace a dist directory outside this checkout.");
  }
  await rm(output, { recursive: true, force: true });
  await mkdir(output, { recursive: true });
  for (const file of publicFiles) {
    const source = join(root, file);
    if ((await lstat(source)).isSymbolicLink())
      throw new Error(`Public asset cannot be a symlink: ${file}`);
    const target = join(output, file);
    await mkdir(dirname(target), { recursive: true });
    await copyFile(source, target);
  }
  for (const [route, section] of Object.entries(redirects)) {
    await mkdir(join(output, route), { recursive: true });
    await writeFile(
      join(output, route, "index.html"),
      `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Hao Tang — Page moved</title><meta http-equiv="refresh" content="0;url=/#${section}"><link rel="canonical" href="https://tanghao205.github.io/#${section}"></head><body><p>This page has moved. <a href="/#${section}">Continue to Hao Tang’s portfolio.</a></p></body></html>\n`,
    );
  }
  await writeFile(join(output, ".nojekyll"), "");
  await writeFile(
    join(output, "robots.txt"),
    "User-agent: *\nAllow: /\nSitemap: https://tanghao205.github.io/sitemap.xml\n",
  );
  await writeFile(
    join(output, "sitemap.xml"),
    '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://tanghao205.github.io/</loc></url></urlset>\n',
  );
  await writeFile(
    join(output, "404.html"),
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Page not found — Hao Tang</title><link rel="stylesheet" href="/assets/portfolio/style.css"></head><body><main class="shell contact-section"><div><p class="eyebrow">404 / A SMALL DETOUR</p><h1>Let’s get you<br><em>back on track.</em></h1><p class="hero-description">This page isn’t here. My work and projects are on the homepage.</p><a class="button button-dark hero-actions" href="/">Back to the portfolio ↗</a></div></main></body></html>\n`,
  );
  return publicFiles.length + generatedFiles.length;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(`Built ${await build()} public files in dist/.`);
}

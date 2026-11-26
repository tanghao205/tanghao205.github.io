import assert from "node:assert/strict";
import { readFile, readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { output, publicFiles, generatedFiles, redirects } from "./build.mjs";

async function walk(directory, prefix = "") {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const relative = `${prefix}${entry.name}`;
    assert(!entry.isSymbolicLink(), `Symlink in build: ${relative}`);
    if (entry.isDirectory())
      files.push(...(await walk(join(directory, entry.name), `${relative}/`)));
    else files.push(relative);
  }
  return files;
}
const files = await walk(output);
assert.deepEqual(
  files.sort(),
  [...publicFiles, ...generatedFiles].sort(),
  "Build must contain only explicitly approved public files.",
);
assert(
  files.every((file) => !/private|resume|\.docx?$|\.env|\.git\//i.test(file)),
  "Private file in public build.",
);
const html = await readFile(join(output, "index.html"), "utf8");
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
assert.equal(new Set(ids).size, ids.length, "Duplicate element IDs.");
for (const [, target] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
  if (target.startsWith("#"))
    assert(ids.includes(target.slice(1)), `Missing section: ${target}`);
  else if (target.startsWith("/") && !target.startsWith("//"))
    assert(files.includes(target.slice(1)), `Missing asset: ${target}`);
}
const css = await readFile(join(output, "assets/portfolio/style.css"), "utf8");
for (const [, file] of css.matchAll(/url\(['"]?(\/[^)'"\s]+)/g))
  assert(files.includes(file.slice(1)), `Missing CSS asset: ${file}`);
for (const [route, target] of Object.entries(redirects)) {
  assert(ids.includes(target), `Redirect ${route} points to missing section ${target}`);
  assert(
    (await readFile(join(output, route, "index.html"), "utf8")).includes(
      `url=/#${target}`,
    ),
  );
}
assert(
  !/UA-156453592|fire-th@hotmail|tanghao205@gmail|281-682/.test(html),
  "Private contact details or legacy tracking in homepage.",
);
const bytes = (
  await Promise.all(files.map(async (file) => (await stat(join(output, file))).size))
).reduce((a, b) => a + b, 0);
assert(bytes < 1_000_000, "Public build exceeds 1 MB budget.");
console.log(
  `Verified ${files.length} public files, local links, redirects, private-file exclusion, and ${(bytes / 1024).toFixed(0)} KB build size.`,
);

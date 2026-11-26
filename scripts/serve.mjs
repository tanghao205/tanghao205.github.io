import { createServer } from "node:http";
import { readFile, stat, realpath } from "node:fs/promises";
import { watch } from "node:fs";
import { extname, resolve, sep, join } from "node:path";
import { build, output, root, publicFiles } from "./build.mjs";

await build();
const portArgument = process.argv.find((arg) => arg.startsWith("--port="));
const port = Number(portArgument?.split("=")[1] || process.env.PORT || 4173);
const watching = process.argv.includes("--watch");
const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml",
};
const clients = new Set();
const reloadScript = `<script>new EventSource('/__reload').onmessage=()=>location.reload();</script>`;

const server = createServer(async (req, res) => {
  if (!["GET", "HEAD"].includes(req.method)) {
    res.writeHead(405, { Allow: "GET, HEAD" }).end();
    return;
  }
  if (watching && req.url === "/__reload") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });
    res.write(": connected\n\n");
    clients.add(res);
    req.on("close", () => clients.delete(res));
    return;
  }
  try {
    const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    let file = resolve(output, `.${pathname}`);
    if (file !== output && !file.startsWith(output + sep))
      throw new Error("Outside public output");
    if ((await stat(file)).isDirectory()) file = join(file, "index.html");
    if (!(await realpath(file)).startsWith((await realpath(output)) + sep))
      throw new Error("Outside public output");
    let content = await readFile(file);
    if (watching && extname(file) === ".html")
      content = Buffer.from(
        content.toString().replace("</body>", `${reloadScript}</body>`),
      );
    res.writeHead(200, {
      "Content-Type": mime[extname(file)] || "application/octet-stream",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    });
    res.end(req.method === "HEAD" ? undefined : content);
  } catch {
    res.writeHead(404, {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    });
    const content = await readFile(join(output, "404.html")).catch(
      () => "Page not found",
    );
    res.end(req.method === "HEAD" ? undefined : content);
  }
});

server.on("error", (error) => {
  console.error(error.message);
  process.exit(1);
});
server.listen(port, "127.0.0.1", () =>
  console.log(
    `Portfolio preview: http://127.0.0.1:${port}${watching ? " (live reload)" : ""}`,
  ),
);

if (watching) {
  let timer;
  let rebuilding = Promise.resolve();
  const refresh = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      rebuilding = rebuilding
        .then(async () => {
          await build();
          console.log("Rebuilt portfolio.");
          for (const client of clients) client.write("data: reload\n\n");
        })
        .catch((error) => console.error(`Build failed: ${error.message}`));
    }, 180);
  };
  for (const file of publicFiles) watch(join(root, file), refresh);
}

import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { dirname, extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

import site from "../src/_data/site.js";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputRoot = join(projectRoot, "_site");
const pathPrefix = site.deploymentPathPrefix.replace(/\/$/, "");
const host = "127.0.0.1";
const port = 4173;

const contentTypes = {
  ".avif": "image/avif",
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
  ".xml": "application/xml; charset=utf-8",
};

function sendFile(response, filePath, statusCode = 200) {
  response.writeHead(statusCode, {
    "Cache-Control": "no-store",
    "Content-Type":
      contentTypes[extname(filePath).toLowerCase()] ??
      "application/octet-stream",
  });
  createReadStream(filePath).pipe(response);
}

async function findFile(pathname) {
  const relativePath = decodeURIComponent(
    pathname.slice(pathPrefix.length + 1),
  );
  let filePath = resolve(outputRoot, relativePath || "index.html");
  const outputBoundary = `${outputRoot}${sep}`;

  if (filePath !== outputRoot && !filePath.startsWith(outputBoundary)) {
    return undefined;
  }

  let fileStat = await stat(filePath).catch(() => undefined);
  if (fileStat?.isDirectory()) {
    filePath = join(filePath, "index.html");
    fileStat = await stat(filePath).catch(() => undefined);
  }

  return fileStat?.isFile() ? filePath : undefined;
}

const server = createServer(async (request, response) => {
  const requestUrl = new URL(request.url ?? "/", `http://${host}:${port}`);
  const pathname = requestUrl.pathname;

  if (pathname === "/" || pathname === pathPrefix) {
    response.writeHead(302, { Location: `${pathPrefix}/` });
    response.end();
    return;
  }

  if (!pathname.startsWith(`${pathPrefix}/`)) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  const filePath = await findFile(pathname);
  if (filePath) {
    sendFile(response, filePath);
    return;
  }

  const notFoundPage = join(outputRoot, "404.html");
  const notFoundStat = await stat(notFoundPage).catch(() => undefined);
  if (notFoundStat?.isFile()) {
    sendFile(response, notFoundPage, 404);
    return;
  }

  response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  response.end("Not found");
});

server.listen(port, host, () => {
  console.log(
    `ICCL production preview: http://${host}:${port}${pathPrefix}/`,
  );
});

import { access, readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputRoot = path.join(projectRoot, "_site");
const pathPrefix = "/";
const errors = [];

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(target)));
    else files.push(target);
  }

  return files;
}

async function exists(target) {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

function stripQueryAndHash(url) {
  return url.split("#", 1)[0].split("?", 1)[0];
}

function resolveInternalTarget(sourceFile, rawUrl) {
  let cleanUrl = stripQueryAndHash(rawUrl);
  if (!cleanUrl) return sourceFile;

  try {
    cleanUrl = decodeURIComponent(cleanUrl);
  } catch {
    errors.push(`${path.relative(projectRoot, sourceFile)}: invalid URL encoding in ${rawUrl}`);
    return null;
  }

  if (cleanUrl.startsWith(pathPrefix)) {
    return path.join(outputRoot, cleanUrl.slice(pathPrefix.length));
  }

  if (cleanUrl.startsWith("/")) {
    return path.join(outputRoot, cleanUrl.slice(1));
  }

  return path.resolve(path.dirname(sourceFile), cleanUrl);
}

async function normaliseTarget(target) {
  if (!target) return null;
  if (await exists(target)) {
    const targetStats = await stat(target);
    if (targetStats.isDirectory()) {
      const directoryIndex = path.join(target, "index.html");
      if (await exists(directoryIndex)) return directoryIndex;
    } else {
      return target;
    }
  }

  if (!path.extname(target)) {
    const directoryIndex = path.join(target, "index.html");
    if (await exists(directoryIndex)) return directoryIndex;
  }

  return target;
}

function isExternal(url) {
  return /^(?:https?:|mailto:|tel:|data:)/i.test(url);
}

function collectJsonLdNodes(value, nodes = []) {
  if (Array.isArray(value)) {
    for (const item of value) collectJsonLdNodes(item, nodes);
  } else if (value && typeof value === "object") {
    nodes.push(value);
    for (const item of Object.values(value)) collectJsonLdNodes(item, nodes);
  }
  return nodes;
}

const outputFiles = await walk(outputRoot);
const htmlFiles = outputFiles.filter((file) => file.endsWith(".html"));

for (const htmlFile of htmlFiles) {
  const relativeName = path.relative(projectRoot, htmlFile);
  const html = await readFile(htmlFile, "utf8");
  const sourceIds = new Set(
    [...html.matchAll(/\bid=["']([^"']+)["']/g)].map((match) => match[1]),
  );

  for (const match of html.matchAll(/\b(href|src)=["']([^"']*)["']/g)) {
    const [, attribute, rawUrl] = match;
    if (!rawUrl) {
      errors.push(`${relativeName}: empty ${attribute}`);
      continue;
    }
    if (isExternal(rawUrl)) continue;

    const target = await normaliseTarget(resolveInternalTarget(htmlFile, rawUrl));
    if (target && !(await exists(target))) {
      errors.push(`${relativeName}: missing target ${rawUrl}`);
      continue;
    }

    const hash = rawUrl.includes("#") ? rawUrl.slice(rawUrl.indexOf("#") + 1) : "";
    if (hash && !rawUrl.startsWith("http")) {
      const targetHtml = target && target.endsWith(".html") ? target : htmlFile;
      const targetMarkup =
        targetHtml === htmlFile ? html : await readFile(targetHtml, "utf8");
      const targetIds =
        targetHtml === htmlFile
          ? sourceIds
          : new Set(
              [...targetMarkup.matchAll(/\bid=["']([^"']+)["']/g)].map(
                (idMatch) => idMatch[1],
              ),
            );
      if (!targetIds.has(hash)) {
        errors.push(`${relativeName}: missing fragment #${hash} in ${rawUrl}`);
      }
    }
  }

  for (const match of html.matchAll(/\bsrcset=["']([^"']+)["']/g)) {
    for (const candidate of match[1].split(",")) {
      const rawUrl = candidate.trim().split(/\s+/, 1)[0];
      if (!rawUrl || isExternal(rawUrl)) continue;
      const target = await normaliseTarget(resolveInternalTarget(htmlFile, rawUrl));
      if (target && !(await exists(target))) {
        errors.push(`${relativeName}: missing srcset target ${rawUrl}`);
      }
    }
  }

  for (const match of html.matchAll(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  )) {
    try {
      const parsed = JSON.parse(match[1]);
      const nodes = collectJsonLdNodes(parsed);

      for (const node of nodes) {
        if (Object.values(node).includes("https://schema.org/EventCompleted")) {
          errors.push(`${relativeName}: invalid EventCompleted schema value`);
        }

        const types = Array.isArray(node["@type"])
          ? node["@type"]
          : [node["@type"]];
        const isEvent = types.includes("Event") || types.includes("Festival");
        if (
          isEvent &&
          node.endDate &&
          new Date(node.endDate) < new Date() &&
          node.offers?.availability === "https://schema.org/InStock"
        ) {
          errors.push(`${relativeName}: completed event advertises InStock`);
        }
      }
    } catch (error) {
      errors.push(`${relativeName}: invalid JSON-LD (${error.message})`);
    }
  }
}

if (errors.length) {
  console.error(`Site validation failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(
    `Site validation passed: ${htmlFiles.length} HTML files and ${outputFiles.length} generated files checked.`,
  );
}

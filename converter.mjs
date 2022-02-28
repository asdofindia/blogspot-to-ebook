import { JSDOM } from "jsdom";
import { createEpub } from "./epub.js";
import crypto from "crypto";
import fs from "fs";
import xmlserializer from "xmlserializer";

const CACHEDIR = ".cache";
fs.mkdirSync(CACHEDIR, { recursive: true });
const keyToHash = (key) => crypto.createHash("md5").update(key).digest("hex");
const keyToFilePath = (key) => `${CACHEDIR}/${keyToHash(key)}`;
const getCache = (key) => {
  try {
    return JSON.parse(fs.readFileSync(keyToFilePath(key)));
  } catch (err) {
    return undefined;
  }
};

const setCache = (key, data) => {
  fs.writeFileSync(keyToFilePath(key), JSON.stringify(data));
};

const fetchUrlText = async (url) => {
  const cached = getCache(url);
  if (cached) return cached;
  return fetch(url).then(async (res) => {
    const text = await res.text();
    setCache(url, text);
    return text;
  });
};

const urlToDom = (url) =>
  fetchUrlText(url).then((text) => new JSDOM(text, { url }));

const olderSelector = "a.blog-pager-older-link";
const titleSelector = ".post-title";
const bodySelector = ".entry-content";
const timeStampSelector = ".timestamp-link";

const domToStructured = (dom) => {
  const title =
    dom.window.document.querySelector(titleSelector)?.textContent?.trim() ||
    "Untitled";
  return {
    title,
    older: dom.window.document.querySelector(olderSelector)?.href,
    id: dom.window.document
      .querySelector(timeStampSelector)
      ?.href?.replace(/\W/g, "_"),
    bodyDom: dom.window.document.querySelector(bodySelector),
  };
};

const swapResources = async (resources, dom) => {
  const nodelist = dom.querySelectorAll("img");
  for (const node of nodelist) {
    const href = node.src;
    if (resources.hasOwnProperty(href)) node.src = `./${resources[href].id}`;
    console.log(`Downloading image: ${href}`);
    const res = await fetch(href);
    const blob = await res.arrayBuffer();
    const mediaType = res.headers.get("content-type");
    resources[href] = {
      id: href.replace(/\W/g, "_"),
      mediaType,
      content: Buffer.from(blob),
    };
    node.src = `./${resources[href].id}`;
  }
  return dom;
};

const fetchPost = (postUrl) => urlToDom(postUrl).then(domToStructured);

let currentUrl = process.argv[2];
const chapters = [];
const resources = {};

while (currentUrl) {
  await fetchPost(currentUrl).then(async ({ title, bodyDom, older, id }) => {
    console.log(title);
    const domSwappedWithLocalImages = await swapResources(resources, bodyDom);
    const contentHtml = xmlserializer.serializeToString(
      domSwappedWithLocalImages
    );
    chapters.unshift({
      id,
      title,
      content: `<div>
          <h1>${title}</h1>
          <div><p><a href="${currentUrl}">Link to original</a></p></div>
          <div>${contentHtml}</div>
        </div>`,
    });
    currentUrl = older;
  });
}

const title = process.argv[4] || "Title"
const creator = process.argv[5] || "Author"

const identifier = (title + creator).replace(/\W/g, ".")

const option = {
  outputPath: process.argv[3] || "output.epub",
  title,
  creator,
  language: "en",
  identifier,
  chapters,
  resources: Object.values(resources),
};

createEpub(option).then(() => console.log("done"));

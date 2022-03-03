/*
Various utilities for blog to ebook converter software
Copyright (C) 2022 Akshay S Dinesh

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.

Find Akshay's contact details at https://asd.learnlearn.in/about/#contact 
*/

import crypto from "crypto";
import xmlserializer from "xmlserializer";
import fs from "fs";
import { JSDOM } from "jsdom";

const CACHEDIR = ".cache";
fs.mkdirSync(CACHEDIR, { recursive: true });
export const keyToHash = (key) =>
  crypto.createHash("md5").update(key).digest("hex");
const keyToFilePath = (key) => `${CACHEDIR}/${keyToHash(key)}`;
export const getCache = (key) => {
  try {
    return JSON.parse(fs.readFileSync(keyToFilePath(key)));
  } catch (err) {
    return undefined;
  }
};
export const setCache = (key, data) => {
  fs.writeFileSync(keyToFilePath(key), JSON.stringify(data));
};

export const createId = (seed) => `id-${keyToHash(seed)}`;
export const escapeHtml = (html) =>
  html
    // https://stackoverflow.com/a/1091953
    // says that only < & & needs replacement
    // because >, ', and " are allowed in text
    .replace(/</g, "&lt;")
    .replace(/&/g, "&amp;");

const fetchUrlText = async (url) => {
  const cached = getCache(url);
  if (cached) {
    console.log(`Got ${url} from cache`);
    return cached;
  }
  console.log(`Downloading text ${url}...`);
  return fetch(url).then(async (res) => {
    const text = await res.text();
    setCache(url, text);
    return text;
  });
};

export const urlToDom = (url) =>
  fetchUrlText(url).then((text) => new JSDOM(text, { url }));

export const swapResources = async (resources, dom) => {
  const nodelist = dom.querySelectorAll("img");
  for (const node of nodelist) {
    const href = node.src;
    if (resources.hasOwnProperty(href)) node.src = `./${resources[href].id}`;
    if (href.startsWith("data:image")) {
      // https://github.com/DiegoZoracKy/image-data-uri/blob/c4e7fb976283362cd3b8f309d413c99ebef167bd/lib/image-data-uri.js#L24
      const matches = href.match("data:(image/.*);base64,(.*)");
      resources[href] = {
        id: createId(href),
        mediaType: matches[1],
        content: new Buffer(matches[2], "base64"),
      };
    } else {
      console.log(`Downloading image: ${href}`);
      const res = await fetch(href);
      const blob = await res.arrayBuffer();
      const mediaType = res.headers.get("content-type");
      resources[href] = {
        id: createId(href),
        mediaType,
        content: Buffer.from(blob),
      };
    }
    node.src = `./${resources[href].id}`;
  }
  return dom;
};

export const processBlogPosts = async (blogPosts) => {
  const resources = {};
  const chapters = [];
  for await (const { title, bodyDom, id, url } of blogPosts) {
    const escapedTitle = escapeHtml(title);
    const domSwappedWithLocalImages = await swapResources(resources, bodyDom);
    const contentHtml = xmlserializer.serializeToString(
      domSwappedWithLocalImages
    );
    chapters.unshift({
      id,
      title: escapedTitle,
      content: `<div>
            <h1>${escapedTitle}</h1>
            <div><p><a href="${url}">Link to original</a></p></div>
            <div>${contentHtml}</div>
          </div>`,
    });
  }
  return { chapters, resources: Object.values(resources) };
};

export const mapOnNodeList = (nodelist, func) => {
  const result = [];
  for (const node of nodelist) {
    result.push(func(node));
  }
  return result;
};

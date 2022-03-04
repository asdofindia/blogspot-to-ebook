/*
Wordpress post downloader code
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

import { urlToDom, createId } from "./utils.mjs";

const olderSelector = "a[rel=prev]";
const newerSelector = "a[rel=next]";
const titleSelector = ".entry-title";
const bodySelector = ".entry-content";

const domToStructured = (dom) => {
  const title =
    dom.window.document.querySelector(titleSelector)?.textContent?.trim() ||
    "Untitled";

  const bodyDom = dom.window.document.querySelector(bodySelector);
  [...bodyDom?.querySelectorAll(".sharedaddy, .jp-relatedposts")].map((n) =>
    n.parentNode.removeChild(n)
  );

  return {
    title,
    older: dom.window.document.querySelector(olderSelector)?.href,
    newer: dom.window.document.querySelector(newerSelector)?.href,
    id: createId(dom.window.document.URL),
    bodyDom,
    url: dom.window.document.URL,
  };
};

const getOnePost = (postUrl) => urlToDom(postUrl).then(domToStructured);

async function* getOlderPostsFrom(startUrl) {
  let currentUrl = startUrl;

  while (currentUrl) {
    const data = await getOnePost(currentUrl);
    yield data;
    currentUrl = data.older;
  }
}

async function* getNewerPostsFrom(startUrl) {
  let currentUrl = startUrl;
  const chapters = [];
  while (currentUrl) {
    await getOnePost(currentUrl).then(({ older, newer, ...data }) => {
      chapters.unshift({
        ...data,
      });
      currentUrl = newer;
    });
  }
  yield* chapters;
}

const getListPage = async (url) => {
  const dom = await urlToDom(url);
  const posts = [...dom.window.document.querySelectorAll(".entry-title a")].map(
    (a) => a?.href
  );
  return {
    posts,
  };
};

export async function* getFromWordPress(url) {
  const parsedUrl = new URL(url);
  if (parsedUrl.pathname === "/") {
    console.log(
      `List detection on WordPress is experimental. Try passing individual blogpost link for better results`
    );
    const guessedStart = (await getListPage(url))?.posts?.[0];
    const { older, newer } = await getOnePost(guessedStart);
    if (newer) {
      yield* getNewerPostsFrom(newer);
      yield* getOlderPostsFrom(guessedStart);
    } else {
      yield* getOlderPostsFrom(guessedStart);
    }
  } else {
    yield* getOlderPostsFrom(url);
  }
}

/*
Blogger post downloader code
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
    id: createId(dom.window.document.querySelector(timeStampSelector)?.href),
    bodyDom: dom.window.document.querySelector(bodySelector),
    url: dom.window.document.URL,
  };
};

const getOneBloggerPost = (postUrl) => urlToDom(postUrl).then(domToStructured);

export const getFromBlogger = async (startUrl) => {
  let currentUrl = startUrl;
  const chapters = [];

  while (currentUrl) {
    await getOneBloggerPost(currentUrl).then(({ older, newer, ...data }) => {
      chapters.unshift({
        ...data,
      });
      currentUrl = older;
    });
  }
  return chapters;
};

/*
Blogpost to ebook converter code
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

import { getFromBlogger } from "./blogger.mjs";
import { createEpub } from "./epub.js";
import { processBlogPosts } from "./utils.mjs";
import { getFromWordPress } from "./wordpress.mjs";

const detectPlatform = (url) => {
  if (url.includes("blogspot")) {
    return "blogger";
  }
  if (url.includes("wordpress")) {
    return "wordpress";
  }
  console.error(
    "Could not detect whether blogger/wordpress from url. Pass the last parameter"
  );
  process.exit(1);
};
const url = process.argv[2];
const platform = process.argv[6] || detectPlatform(url);

const engines = {
  blogger: getFromBlogger,
  wordpress: getFromWordPress,
};

const blogPosts = await engines[platform](url);

const { chapters, resources } = await processBlogPosts(blogPosts);

const title = process.argv[4] || "Title";
const creator = process.argv[5] || "Author";

const identifier = `${title}.${creator}`.replace(/\W/g, ".");

const option = {
  outputPath: process.argv[3] || "output.epub",
  title,
  creator,
  language: "en",
  identifier,
  chapters,
  resources,
};

createEpub(option).then(() => console.log("done"));

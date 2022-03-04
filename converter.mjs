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

import inquirer from "inquirer";
import { getFromBlogger } from "./blogger.mjs";
import { createEpub } from "./epub.js";
import { processBlogPosts } from "./utils.mjs";
import { getFromWordPress } from "./wordpress.mjs";

const detectPlatform = (url) => {
  if (url?.includes("blogspot")) {
    return "blogger";
  }
  if (url?.includes("wordpress")) {
    return "wordpress";
  }
};

const engines = {
  blogger: getFromBlogger,
  wordpress: getFromWordPress,
};

const url = process.argv[2];
const outputPath = process.argv[3];
const title = process.argv[4];
const creator = process.argv[5];
const platform = process.argv[6] || detectPlatform(url);

const confirmed = await inquirer.prompt(
  [
    {
      type: "input",
      name: "url",
    },
    {
      type: "input",
      name: "outputPath",
      default: "output.epub",
    },
    {
      type: "input",
      name: "title",
      default: "Title",
    },
    {
      type: "input",
      name: "creator",
      default: "Creator",
    },
    {
      type: "list",
      name: "platform",
      default: ({ url }) => detectPlatform(url),
      choices: ["blogger", "wordpress"],
    },
  ],
  { url, outputPath, title, creator, platform }
);

const sanitizedUrl = confirmed.url.startsWith("http")
  ? confirmed.url
  : `http://${confirmed.url}`;

const blogPosts = await engines[confirmed.platform](sanitizedUrl);

const chapters = await processBlogPosts(blogPosts);

const identifier = `${title}.${creator}`.replace(/\W/g, ".");

const option = {
  outputPath: confirmed.outputPath,
  title: confirmed.title,
  creator: confirmed.creator,
  language: "en",
  identifier,
  chapters,
  reverseChapters: true,
};

await createEpub(option);
console.log(`Output ready at ${confirmed.outputPath}`);

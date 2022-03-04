/*
epub.js epub generating code
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

// An epub file is just a specialized zip archive
const archiver = require("archiver");
// The content is xhtml. It can be supplied by user as html
// or as a JSDOM
const jsdom = require("jsdom");
// Images, etc can be included in the zip from the filesystem
const fs = require("fs");

// This program creates an epub.

// Here's how to do that
const createEpub = async ({
  // Things we need are
  title,
  creator,
  language,
  identifier, // which is a unique ID

  // a list of special object called chapters
  chapters,
  reverseChapters,

  // and an
  outputPath,
}) => {
  // With all that, we can start building the package
  // See: https://www.archiverjs.com/docs/quickstart
  const archive = archiver("zip", {
    zlib: {
      level: 9, // compression level
    },
  });
  // That's the archive configuration. We will pipe that to the outputPath
  const output = fs.createWriteStream(outputPath);
  archive.pipe(output);

  // The first thing to put in it is always a special file
  archive.append("application/epub+zip", { name: "mimetype" });

  // Then there is a container file which points to the root file
  archive.append(
    `<?xml version="1.0" encoding="UTF-8"?>
  <container xmlns="urn:oasis:names:tc:opendocument:xmlns:container" version="1.0">
     <rootfiles>
        <rootfile full-path="package.opf" media-type="application/oebps-package+xml"/>
     </rootfiles>
  </container>`,
    { name: "META-INF/container.xml" }
  );

  // Each chapter and its resources has to be put in package.opf manifest
  // Similarly each chapter has to be put in toc
  // We will collect these entries as we process each chapter
  const manifestItems = [];
  const tocItems = [];

  // Now let us process each chapter
  for await (const chapter of chapters) {
    // Add the chapter to archive)
    archive.append(chapter.content, { name: `${chapter.id}.xhtml` });

    // Also add the chapter to manifest and toc
    manifestItems.push({
      id: chapter.id,
      href: `${chapter.id}.xhtml`,
      mediaType: "application/xhtml+xml",
    });
    tocItems.push({
      id: chapter.id,
      title: chapter.title,
    });

    // Within the chapter, each resource has to be added too
    for await (const resource of chapter.resources) {
      // to archive
      archive.append(resource.content, { name: resource.id });
      // to manifest
      manifestItems.push({
        id: resource.id,
        href: resource.id,
        mediaType: resource.mediaType,
      });
    }
  }

  // If chapters are given in reverse by the user, we have to reverse it
  if (reverseChapters) {
    tocItems.reverse();
  }
  // Now we can create toc

  // Each entry in toc will look like:
  const createTocEntry = (item) =>
    `<li><a href="${item.id}.xhtml">${item.title}</a></li>`;

  archive.append(
    `<?xml version="1.0" encoding="utf-8"?>
    <html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
    <head></head>
      <body>
        <nav epub:type="toc" id="toc" role="doc-toc">
          <h1 class="title">Table of Contents</h1>
          <ol>
            ${tocItems.map(createTocEntry).join("\n")}
          </ol>
        </nav>
      </body>
    </html>
    `,
    { name: "htmltoc.xhtml" }
  );

  // Now the package.opf

  // Each item in the manifest will look like
  // <item href="somelink.html" id="some-id" media-type="type"/>
  const createManifestItem = (item) => `
    <item href="${item.href}" 
          id="${item.id}"
          media-type="${item.mediaType}"
    />`;

  // Each spine item will look like
  const createSpineItem = (item) => `<itemref idref="${item.id}"/>`;

  // Now we can create the root file itself
  archive.append(
    `<?xml version="1.0" encoding="UTF-8"?>
      <package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="uid">
         <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
            <dc:identifier id="uid">${identifier}</dc:identifier>
            <dc:title>${title}</dc:title>
            <dc:creator>${creator}</dc:creator>
            <dc:language>${language}</dc:language>
            <meta property="dcterms:modified">2012-02-27T16:38:35Z</meta>
         </metadata>
         <manifest>
            <item href="htmltoc.xhtml" id="htmltoc" media-type="application/xhtml+xml" properties="nav" />
            ${manifestItems.map(createManifestItem).join("\n")}
         </manifest>
         <spine>
            <itemref idref="htmltoc" />
            ${tocItems.map(createSpineItem).join("\n")}
         </spine>
      </package>`,
    { name: "package.opf" }
  );

  // Now we can finalize the archive
  archive.finalize();
  // And the package is ready!
};

module.exports = { createEpub };

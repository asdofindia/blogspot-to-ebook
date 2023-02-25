# Blog to EPUB eBook

Are you the kind of person who sees an interesting new blog and want to read from start to finish?

Do you wish it was easier to navigate the layout? Do you wish you got the whole thing as a book?

Here's a tool for you

## Features
* <img src="http://www.blogger.com/favicon.ico" width=16 height=16/> Blogger/Blogspot to eBook (epub)
* <img src="http://wordpress.com/favicon.ico" width=16 height=16/> WordPress to eBook (epub)
* Interactive mode and non-interactive mode
* Automatic table of contents generation (links to each post)
* Chronologically ordered (allowing reading from the earliest post in a blog)

## Installation

* Clone this repo
* `npm install`


## Running

### Interactively

* `node converter.mjs`
* Answer questions

(If your node version is <18, you will have to do `node --experimental-fetch converter.mjs`)

### For blogger with non-modern themes

* Get to the URL of the latest (newest) post in the blog. (The tool will go find older links starting from this post)
* `node converter.mjs https://blog.learnlearn.in/2021/11/why-i-am-back-on-whatsapp.html blissful-life.epub "Blissful Life" "Akshay S Dinesh" blogger` 
* (Here, the parameters are: URL of the latest post, output file name, title of the book, author's name, blogger/wordpress)

### For blogger with modern themes

* `node converter.mjs https://shares.learnlearn.in shares.epub "Shares" "Akshay S Dinesh" blogger`

### For wordpress

* `node converter.mjs https://asdofindia.wordpress.com akshay-wp.epub "Akshay's wordpress" "Akshay S Dinesh" wordpress`

## Cleaning cache

Network requests are cached in `.cache` to avoid repeated queries. Delete the folder to clean up cache.

## Participating

If you want to add features, fix bugs, add documentation, or participate in this project in any manner, you are welcome to.

Do be nice to everyone and be constructive.

For code contributions, a nice git workflow can be read in [webogram's contribution guide](https://github.com/zhukov/webogram/blob/master/CONTRIBUTING.md).

Issues can be found and filed [here](https://github.com/asdofindia/blogspot-to-ebook/issues).

Code gets licensed in AGPL.
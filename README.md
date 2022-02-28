# Blogpost to EPUB eBook

Are you the kind of person who sees an interesting new blog and want to read from start to finish?

Do you wish it was easier to navigate the layout? Do you wish you got the whole thing as a book?

Here's a tool for you

## Installation

* Clone this repo
* `npm install`


## Running

* Get to the URL of the latest (newest) blogpost in the blog. (The tool will go find older links starting from this post)
* `node --experimental-fetch converter.mjs https://blog.learnlearn.in/2021/11/why-i-am-back-on-whatsapp.html blissful-life.epub "Blissful Life" "Akshay S Dinesh"`
* (Here, the parameters are: URL of the latest post, output file name, title of the book, author's name)

## Cleaning cache

Network requests are cached in `.cache` to avoid repeated queries. Delete the folder to clean up cache.
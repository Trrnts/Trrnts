Trrnts is the front page for the BitTorrent network, providing insights through interactive analytics and data visualizations that leverage the DHT protocol. The project is currently being developed at Hack Reactor.

It is similar to The Pirate Bay, but without porn ads.

If you want to have a look at this awesome project check out our deployed app at http://trrnts.azurewebsites.net

Getting started

Install Redis (our primary database).
Start Redis using redis-server.

Since Redis keeps all your data in memory, it is typically a good idea to limit the maximum amount of memory it can take up using redis-server --maxmemory 1mb.

Start the server using node server.

This is can done using grunt during development.

Start the crawler.

The crawler is the heart of our app. It sends about ~4000 UDP packages per second and takes up a significant amount of memory, since it caches data before writing it to the DB. You can run it using node workers/masterCrawler during development. When deploying the app, it is a good idea to use forever for this. Just install it globally using npm i -g forever and start the worker using forever start -a -l /dev/null workers/masterCrawler.js.

Design Philosophy

No lib folder

If you would put it in lib/, then it belongs in a separate module.

Beauty

The goal of this site is to be so beautiful, that people want to publish their torrents to Trrnts just to be a part of it. The design of the site must be elegant. Colors, fonts, and spacing must be humane, consistent, and make relevant information clear.

Unceremonious MVC

No big MVC class hierarchy. Just have the route handler get some data, then stringify it to JSON. Simpler is better.

Small Modules

No single JavaScript file should be more than about 200 lines. If it is, then that's a sign that it should be split up.

Check in node_modules and bower_components

Every time you add a dependency, check it into git. This is a deployed website. We need to keep things predictable. Further, this is an official recommendation by npm (FAQ).

No Binary Dependencies

There is no need. We are proxying data to Redis. It's all JSON and HTML. Node can do that just fine without compiling anything.

Understanding the code

Directory strucure

Workers:

Our worker (node workers/masterCrawler.js) is responsible for crawling the BitTorrent DHT network and generating the location stats. It implements the necessary parts of the BitTorrent DHT protocol (aka BEP 5). The low-level DHT interaction is implemented in crawl.js. masterCrawler.js simply glues all the magic together and spams the Redis database.

Server:

There is no server-side rendering. All the server does is it implements some basic routing functionality and CRUD operations for magnets. That's it. Nothing fancy.

Client:

The client uses AngularJS and interacts with our server-side API. main.js is a good starting point. Make sure to run grunt during development, since we require the compiled main.min.js file. A source map is in place for debugging.

A word about Redis

Redis is a key-value store. It is incredible fast, but quite dumb (compared to MongoDB). You can think of it as a POJO. It supports some really sophisticated data-structures, like HyperLogLog. We use HyperLogLog in order to anonymously store peers in a memory-effcient way. MongoDB doesn't fit our use-case for two reasons:

It is too slow.

Redis is blazingly fast. That's it.

It stores data in a way that is quite memory inefficient.

As noted above, we take advantage of HyperLogLog, which enables us to dramatically reduce our memory-usage. Storing all peers in a MongoDB document would blow up/ freeze your computer within minutes. Be careful! Clearing your memory from time to time using sudo purge is a good idea.

Redis can also be used for integrating a simple search functionality by building out an inverted index.

The DHT protocol implementation

The BitTorrent DHT protocol is based on UDP, which is a connection-less, low-level protocol. We use the Node.JS dgram library for this. More abstract ways of interacting with the BitTorrent DHT network exist, but they are pretty slow and and don't fit our use-case, since they don't really crawl the network for all peers, but try to find a certain number of them (like a BitTorrent client usually would).

The stack

We are currently using "A NERD"-stack:

**A**ngular
**N**odeJS
**E**xpress
**R**edis
**D**3
Contributions

To make everyone's life easier we have created some guidelines
here

Authors

Alexander Gugel: GitHub
Antonio Grimaldo: GitHub
Josh Wyatt: GitHub
Salman Khan: GitHub
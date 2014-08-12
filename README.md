Trrnts
======

Trrnts is the front page for the BitTorrent network, providing insights through
interactive analytics and data visualizations that leverage the DHT protocol.
The project is currently being developed at Hack Reactor.

It is similar to The Pirate Bay, except there is no actual uploading or downloading of files. There is only information on what other people on the BitTorrent network are doing.

If you want to have a look at this awesome project check out our deployed app at
http://trrnts.azurewebsites.net

Check out the screencast on basic usage:
https://www.youtube.com/watch?v=hDtmQcjm81c

Getting started
---------------

* Install [Redis](http://redis.io) (our primary database).

  You should definitely use the Redis documentation anytime you have questions about what a command does, or, what kinds of commands you can use for a particular kind of data structure.

  We chose to use Redis because it is simple and fast.

* Start Redis using `redis-server`.

  Since Redis keeps **all** your data in memory, it is typically a good idea to
  limit the maximum amount of memory it can take up using
  `redis-server --maxmemory 1mb`.

  If you need to flush the redis database, you can enter the redis command line interface with the comman `redis-cli` and then type `flushall`.

* Start the server using `node server`.

  This is can done instead using `grunt` during development.

* Start the crawler.

  The crawler is the *heart* of our app. It sends ~4000 UDP packages per
  second and takes up a significant amount of memory, since it caches data
  before writing it to the DB. You can run it using `node workers/masterCrawler`
  during development. When deploying the app, it is a good idea to use `forever`
  for this. Just install it globally using `npm i -g forever` and start the
  worker using `forever start -a -l /dev/null workers/masterCrawler.js`.

* Open the app in localhost at the port specified when you ran the server. (Because of some angular quirks, you won't have much luck looking at the application from your file system...you need to run it off a server.)

Design Philosophy
-----------------

* No lib folder

    If you would put it in `lib/`, then it belongs in a separate module.

* Beauty

    The goal of this site is to be so beautiful, that people want to publish
    their torrents to Trrnts just to be a part of it. The design of the site
    must be elegant. Colors, fonts, and spacing must be humane, consistent, and
    make relevant information clear.

    We prefer speed and minimalism to flash and distraction. This site is definitely data driven.

* Unceremonious MVC

    No big MVC class hierarchy. Just have the route handler get some data, then
    stringify it to JSON. Simpler is better.

    That said, we are using Angular, at the least so that we can learn Angular better. You should keep away from jQuery. You should inject your dependencies. You should keep your controllers very thin and definitely create any new pages as ng-views (see `client/views/`).

* Small Modules

    No single JavaScript file should be more than about 200 lines. If it is,
    then that's a sign that it should be split up.

    Probably they shouldn't be bigger than 100 lines....but that means you have some cleaning up to do, sorry.

* Check in node_modules and bower_components

    Every time you add a dependency, check it into git. This is a deployed
    website. We need to keep things predictable. Further, this is an official
    recommendation by npm ([FAQ](https://www.npmjs.org/doc/faq.html)).

    This is definitely not what Hack Reactor taught us. But if you read the link above you might feel the way we do. Or at least the way Alex does.

* No Binary Dependencies

    There is no need.  We are proxying data to Redis.  It's
    all JSON and HTML.  Node can do that just fine without compiling
    anything.

Understanding the code
----------------------

### Directory strucure

* High-level description of back-end infrastructure:

  The BitTorrent network is not as crazy as you probably think it is. We learned about graphs and hash tables and that's basically all it is.

  Every node in the graph (this is an oversimplification, by the way), does just a few things. It carries around a piece of a file. It communicates with other nodes. When it communicates with other nodes, it asks if those other nodes if they have a piece of the file that it is trying to get. It also asks other nodes if they know of other nodes that also have a piece of the file that it is looking for. While it's interacting with another node, it goes ahead and records a bunch of information regarding what other nodes are nearby and what kinds of files they contain. The other node we're communicating with basically does all the same things, and then, if it's appropriate, they actually hand off the pieces of file that they have.

  They way that the information is sorted around nearby nodes that do, or might have a piece of the file that you are looking for has been highly optimized, and now is probably a great time, if you haven't done it yet already, to read [BEP 5](www.bittorrent.org/beps/bep_0005.html), and also check out the [Kademlia](http://en.wikipedia.org/wiki/Kademlia) algorithm that BitTorrent protocol is based on, assuming you're interested in know how the whole thing works.

  It's worth mentioning that BitTorrent protocol is actually deprecated, and the current iteration of the BitTorrent network is now running off of DHT protocol. DHT stands for Distibuted Hash Table. It is a graph of nodes that each have many hash tables of information concerning the whereabouts and contents of other nodes.

  Important Terms: Node and Peer. A peer refers to a node that actually has a piece of the file we are looking for. When a node is not a peer, it is simply referred to as a node.

  More Important Terms: Magnet Link and InfoHash. The infohash is a unique identifier for a particular file. The Magnet Link for a file contains the infohash as well as other information like the text name of the file we are looking for. People submit Magnet Links to our site, and we use the infohash from the magnet link as the id for the file we are looking for while crawling. We also get the text names of the files, for display purposes, from the magnet links.

  You might be used to working with HTTP, or maybe a little bit with FTP, or may even a little bit with TCP/IP....when BitTorrent network nodes communicate with each other, they do it over UDP. You can research it if you feel the need. Just know that when you're in the source code and you comments like 'necessary formatting for the protocols we are using', that this mostly just refers to places where we had to format or render to/from UDP. You shouldn't have to worry about any of this whatsoever, just don't get all crazy when you see it cause we're just using Node and 3rd party libraries to translate when we need to.

  So the cool thing about the BitTorrent network, and the main reason why big industry has not been able to shut it down in spite of the fact that it has cost them a ton of profit (though certainly not all of it) is that once a file has been uploaded into the network, there is no longer a single place that you can take offline to remove accessibility to the file. The way that we crawl the BitTorrent network, and this is the same way that a BitTorrent client participates in torrenting, is to start by asking a few random nodes that we happen to know are a part of the network if they have the file we are looking for, and then what do they know about the whereabouts of all kinds of files. We then, based on what we just learned, go to the next best node and repeat the exchange. As soon as we have a piece of a file, we are now also able to give it to other nodes who might ask us for it. It's distributed, not hierachical.

  This program does not actually get or give any files...it just gathers the data about where the files are.

  getPeersRequest is the function we use that actually asks other nodes if they have the file we are looking for. If you dig into that function (which you don't need to do) you'll see a bunch of asynchronous stuff like socket connections, and also some weird language translation stuff. A getPeersRequest returns a list of Peers (if the present node knows of any) and also a list of Nodes (rememeber, nodes don't have our file, but might know one that does).

  getPeersRequest is called from inside of the crawl function. Once we get information back from the getPeersRequest we store it in a relevant way to the redis database, and then also, store what we need for the crawler to continue, in local variables. These local variables create the queue structure that our crawler works through as it looks to move through the network as fast as possible. We delete parts of these local variable queue structures when we no longer need them, and the server interacts with the redis database to supply the necessary data to our front end data visualizations.

  Our crawler actually is very fast, and also the BitTorrent network is humonguous by its own right. The crawler will fill up your computer in a few minutes if it weren't throttled. That brings us to our next point. We had to throttle the crawler quite a lot so it didn't break everything. Again, you don't need to mess with the crawler I don't think. If you do mess with it be prepared for it to break, or for it to freeze your computer.

  That's really about it. Look up the Redis documentation on the parts of the code that actually add the info to the database and you'll be able to figure out about the data structures we are using. I might as well tell you that whenever we find a peer, we store it along with a timestamp of when we found it. If you wanted to ever be able to search for the most popular torrents within a given time frame, then you could use the timestamps to help out with this.

  As for the geo locating, each node also happens to have an IP address! We just used a third party library to tell us the latitude and longitude of each of those IP addresses so that we could visualize it.

* Workers:

  Our worker (`node workers/masterCrawler.js`) is responsible for crawling the
  BitTorrent DHT network and generating the location stats. It implements the
  necessary parts of the BitTorrent DHT protocol (*aka
  [BEP 5](www.bittorrent.org/beps/bep_0005.html)*). The low-level DHT
  interaction is implemented in `crawl.js`. `masterCrawler.js` simply glues all
  the magic together and spams the Redis database.

* Server:

  There is no server-side rendering. All the server does is it implements some
  basic routing functionality and CRUD operations for magnets. That's it.
  Nothing fancy.

* Client:

  The client uses [AngularJS](https://angularjs.org/) and interacts with our
  server-side API. `main.js` is a good starting point. Make sure to run `grunt`
  during development, since we require the compiled `main.min.js` file. A
  source map is in place for debugging.

### A word about Redis

[Redis](http://redis.io) is a key-value store. It is incredibly fast, but quite
dumb (compared to MongoDB). You can think of it as a POJO. It supports some
really sophisticated data-structures, like
[HyperLogLog](http://antirez.com/news/75). We use HyperLogLog in order to
anonymously store peers in a memory-effcient way. MongoDB doesn't fit our
use-case for two reasons:

1. It is too slow.

  Redis is blazingly fast. That's it.

2. It stores data in a way that is quite memory inefficient.

  As noted above, we take advantage of HyperLogLog, which enables us to
  dramatically reduce our memory-usage. Storing all peers in a MongoDB document
  would blow up/ freeze your computer within minutes. **Be careful!** Clearing
  your memory from time to time using `sudo purge` is a good idea.

Redis can also be used for integrating a simple search functionality by
building out an [inverted index](en.wikipedia.org/wiki/Inverted_index).

### The DHT protocol implementation

The [BitTorrent DHT protocol](www.bittorrent.org/beps/bep_0005.html) is based
on UDP, which is a connection-less, low-level protocol. We use the Node.JS
[dgram](nodejs.org/api/dgram.html) library for this. More abstract ways of
interacting with the BitTorrent DHT network exist, but they are pretty slow and
and don't fit our use-case, since they don't really crawl the network for all
peers, but try to find a certain number of them (like a BitTorrent client
usually would).

The stack
---------

We are currently using "_A NERD_"-stack:

- **A** ngular
- **N** odeJS
- **E** xpress
- **R** edis
- **D** 3

Contributions
-------------

To make everyone's life easier we have created some guidelines  
[here](https://github.com/Trrnts/Trrnts/blob/master/CONTRIBUTING.md)

Authors
-------

- Alexander Gugel: [GitHub](https://github.com/alexanderGugel)
- Antonio Grimaldo: [GitHub](https://github.com/grimi94)
- Josh Wyatt: [GitHub](https://github.com/joshWyatt)
- Salman Khan: [GitHub](https://github.com/smk1992)

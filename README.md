poketo-service
============

A micro-service / micro-app for the Poketo manga reader. Scrapes sites and stores minimal data about collections.

For supported sites and a Node library, check out [the library docs](https://github.com/poketo/lib).

## Documentation

### Context

It's nice when browsers can handle everything on their own. The fewer servers involved, the better. Unfortunately, due to web restrictions browsers can't:

* Scrape sites on other domains
* Sync data across devices
* Persist data on devices over long periods of time

This service fills those gaps. It uses Node to scrape scanlator or aggregator sites for series info and chapter images. It stores manga collections on a server for permanence and cross-device browsing, but captures as little data as possible (ie. no email, no accounts).

### API

More detailed docs to come, but for now…

```
# Collection endpoints
POST   /collection/new                              Create a new collection
GET    /collection/:slug                            Get collection and series data
POST   /collection/:slug/bookmark/new               Create a new bookmark
DELETE /collection/:slug/bookmark/:seriesId         Remove a bookmark
POST   /collection/:slug/bookmark/:seriesId/read    Mark a bookmark as "read"

# Poketo endpoints
GET    /series?url=1                                Get series info by URL
GET    /series?siteId=1&seriesSlug=2                Get series info by site and slug
GET    /chapter?url=1                               Get chapter info by URL
GET    /chapter?siteId=1&seriesSlug=2&chapterSlug=3 Get chapter info by site and slug
```

The Poketo endpoints are direct calls to the [poketo library](https://github.com/poketo/lib), so others can build on top of it too.

### Colophon

Deployed on [Now](https://now.sh). Collection data is stored in a MongoDB database from [mLab](https://mlab.com). Front-end code can be found at [poketo/site](https://github.com/poketo/site).

Feel free to clone and run your own instance with the same setup!

### License

MIT

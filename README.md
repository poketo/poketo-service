poketo-service
============

A micro-service / micro-app for grabbing data from the [Poketo library](/poketo/service/tree/master/lib/api).

### Context

It's nice when browsers can handle everything on their own. The fewer servers involved, the better. Unfortunately, due to web restrictions browsers can't:

* Scrape sites on other domains
* Sync data across devices
* Persist data on devices over long periods of time

This service fills those gaps. It uses Node to scrape scanlator or aggregator sites for series info and chapter images. It stores manga collections on a server for permanence and cross-device browsing, but by capturing as little data as possible (ie. no email, no accounts).

### Supported Sites

Site   | URL  | Supports Following | Supports Reading
-------|------|--------------------|------------------
Helvetica Scans | http://helveticascans.com | ✓ | ✓ |
MangaHere | http://www.mangahere.cc | ✓ | ✓ (very slow) |
MangaUpdates | http://mangaupdates.com | ✓ | |
Mangadex | https://mangadex.org | ✓ | ✓ |
Mangakakalot | http://mangakakalot.com | ✓ | ✓ |
Manganelo | http://manganelo.com | ✓ | ✓ |
Meraki Scans | http://merakiscans.com | ✓ | ✓ |

If there's a site / group you'd like to see supported, [make an issue!](https://github.com/poketo/service/issues/new)

### API Documentation

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
GET    /series?siteId=1&seriesSlug2                 Get series info by site and slug
GET    /chapter?=url=1                              Get chapter info by URL
GET    /chapter?siteId=1&seriesSlug=2&chapterSlug=3 Get chapter info by site and slug
```

The plan is to split the ["api" folder](https://github.com/poketo/service/tree/master/lib/api) into it's own Node library so others can build on top of it too.

### Colophon

Deployed on [Now](https://now.sh), hooked into a MongoDB database from [mLab](https://mlab.com) for persistence. Feel free to clone and run your own instance with the same setup! Front-end code can be found at [poketo/site](https://github.com/poketo/site).


### License

MIT

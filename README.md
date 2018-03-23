Poketo Service
============

Lightweight service for the [Poketo manga reader](https://poketo.site).

It's nice when browsers can handle everything on their own. The fewer servers involved, the better. Unfortunately, due to web restrictions browsers can't:

* Scrape sites
* Sync across devices
* Persist data over long periods of time

This service fills those gaps. It uses Node to scrape scanlator / aggregator sites for series info and chapter images. It stores manga collections on a server for permanence and cross-device browsing, but only as little data as possible (ie. no email, no accounts).

Supported Sites / Groups
------------------------

Group  | Supports Watching | Supports Reading
-------|-------------------|-----------------
[Helvetica Scans](http://helveticascans.com/) | ✓ | ✓ |
[MangaHere](http://www.mangahere.cc/) | ✓ | ✓ (slow) |
[MangaUpdates](http://mangaupdates.com/) | ✓ | |
[Mangakakalot](http://mangakakalot.com) | ✓ | ✓ |
[Meraki Scans](http://merakiscans.com/) | ✓ | ✓ |

If there's a site / group you'd like to see supported, [make an issue!](https://github.com/rosszurowski/poketo-service/issues/new)

Endpoints
---------

More detailed documentation to come, but for now…

```
GET    /

POST   /collection/new                             Create a new collection
GET    /collection/:slug                           Get collection and series data
POST   /collection/:slug/bookmark/new              Create a new bookmark
DELETE /collection/:slug/bookmark/:seriesId        Remove a bookmark
POST   /collection/:slug/bookmark/:seriesId/read   Mark a bookmark as "read"

GET    /series/:url                                Get series info by URL
GET    /series/:siteId/:seriesSlug                 Get series info by site and slug
GET    /chapter/:url                               Get chapter info by URL
GET    /chapter/:siteId/:seriesSlug/:chapterSlug   Get chapter info by site and slug
```


Details
-------

Deployed on [Now](https://now.sh) at [poketo-api.now.sh](https://poketo-api.now.sh). Fork this repo on [Glitch](https://glitch.me) if you want to run your own instance.

Front-end code can be found at [rosszurowski/poketo-site](https://github.com/rosszurowski/poketo-site).


License
-------

MIT

poketo-lib
==========

A Node library for fetching data from manga aggregator and scanlator sites.

:construction: This project is still v0.x.x and the API is subject to change, especially as more sites are added.

## Install

**Coming soon!** Right now this library is still baked into the Poketo micro-service to make developing easier. But in the future:

```
npm install poketo --save
```

## Docs

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

### API

```
import poketo from 'poketo';
```

#### `poketo.getSeries(siteId: string, seriesSlug: string): Promise<Series>`

Get metadata about a series, including metadata (but not pages) for individual chapters.

```
const series = await poketo.getSeries('meraki-scans', 'senryu-girl');

{
  id: "meraki-scans:senryu-girl",
  slug: "senryu-girl",
  url: "http://merakiscans.com/senryu-girl",
  title: "Senryu Girl",
  chapters: [
    {
      id: "meraki-scans:senryu-girl:1",
      slug: "1",
      number: 1,
      createdAt: 1522811950
    },
    // 24 more...
  ],
  updatedAt: 1522811950,
}
```

#### `poketo.getChapter(siteId: string, seriesSlug: ?string, chapterSlug: string): Promise<Chapter>`

Get page data for a given chapter. Unlike `poketo.getSeries`, this method does not include much metadata.

```
const chapter = await poketo.getChapter('meraki-scans', 'senryu-girl', '5');

{
  id: "meraki-scans:senryu-girl:1",
  slug: "1",
  url: "http://merakiscans.com/senryu-girl/5",
  pages: [
    { id: '01', url: 'http://…/image01.png', width: 800, height: 1200 },
    { id: '02', url: 'http://…/image02.png', width: 800, height: 1200 },
    // etc...
  ]
}
```

### Motivation

People should be able to read content on the web in the way that works for them. Manga reader sites are a special brand of bad. Each page in a chapter is a new page load, ads everywhere, yuck!

The Poketo Node library wraps scraping logic across a number of sites to make it easy to fetch data about and read series how you'd like.

## License

MIT

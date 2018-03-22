// @flow

import Koa from 'koa';
import route from 'koa-route';
import bodyparser from 'koa-bodyparser';
import cors from '@koa/cors';

import pmap from 'p-map';
import shortid from 'shortid';

import poketo from './api';
import db, { Collection } from './db';
import utils from './utils';

const app = new Koa();

app.use(cors());
app.use(bodyparser());

app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    ctx.status = err.statusCode || err.status || 500;
    ctx.body = err.statusMessage || err.message;
    ctx.app.emit('error', err, ctx);
  }
});

/**
 * Routes
 *
 * GET    /
 * POST   /collection/new
 * GET    /collection/:slug
 * POST   /collection/:slug/bookmark/new
 * DELETE (missing) /collection/:slug/bookmark/:seriesId
 * POST   /collection/:slug/bookmark/:seriesId/read
 *
 * GET    /series/:url
 * GET    /series/:siteId/:seriesSlug
 * GET    /chapter/:url
 * GET    /chapter/:siteId/:seriesSlug/:chapterSlug
 */

app.use(
  route.get('/', async ctx => {
    ctx.body = '🔖';
  }),
);

app.use(
  route.post('/collection/new', async ctx => {
    const { bookmarks } = ctx.request.body;

    ctx.assert(Array.isArray(bookmarks), 400, `Bookmarks must be an array`);
    ctx.assert(bookmarks.length > 0, 400, `Bookmarks must have at least one series URL`);

    const series = await pmap(
      bookmarks,
      bookmark => poketo.getSeries(bookmark.url),
      { concurrency: 3 },
    );

    const newCollection = new Collection({
      slug: shortid.generate(),
      bookmarks: [],
    });

    series.forEach((s, i) => {
      const bookmark = bookmarks[i];
      newCollection.addBookmark(s, bookmark.linkToUrl, bookmark.lastReadAt);
    });

    await newCollection.save();

    ctx.body = newCollection;
  }),
);

app.use(
  route.get('/collection/:slug', async (ctx, slug) => {
    const collection = await Collection.findOne({ slug });
    ctx.assert(collection, 404);
    const bookmarks = collection.get('bookmarks');

    const series = await pmap(
      bookmarks,
      bookmark => poketo.getSeries(bookmark.url),
      { concurrency: 3 },
    );

    const sortedSeries = series
      .slice()
      .sort((a, b) => b.updatedAt - a.updatedAt);

    ctx.body = {
      collection: {
        slug,
        bookmarks,
      },
      series: sortedSeries,
    };
  }),
);

app.use(
  route.post(
    '/collection/:slug/bookmark/new',
    async (ctx, slug) => {
      const collection = await Collection.findOne({ slug });
      ctx.assert(collection, 404);

      const { seriesUrl, linkToUrl = null, lastReadAt = 0 } = ctx.request.body;

      ctx.assert(utils.isUrl(seriesUrl), 400, `Invalid URL '${seriesUrl}'`);
      ctx.assert(linkToUrl === null || utils.isUrl(linkToUrl), 400, `Invalid URL '${linkToUrl ? linkToUrl : ''}'`);

      // NOTE: we make a request to the series here to both: (a) validate that
      // we can read and support this series and (b) to normalize the URL and
      // ID through poketo so we're not storing duplicates.
      const series = await poketo.getSeries(seriesUrl);

      try {
        collection.addBookmark(series, linkToUrl, lastReadAt);
      } catch (err) {
        err.status = 400;
        throw err;
      }

      await collection.save();

      ctx.body = {
        collection: {
          slug: collection.get('slug'),
          bookmarks: collection.get('bookmarks'),
        },
        series,
      }
    },
  )
)

app.use(
  route.post(
    '/collection/:slug/bookmark/:seriesId/read',
    async (ctx, slug, seriesId) => {
      const collection = await Collection.findOne({ slug });
      ctx.assert(collection, 404);

      const bookmarks = collection.get('bookmarks');
      const currentBookmarkIndex = bookmarks.findIndex(bookmark => bookmark.id === seriesId);
      const currentBookmark = bookmarks[currentBookmarkIndex];
      ctx.assert(currentBookmarkIndex !== -1, 404, `Could not find bookmark with ID ${seriesId}`);

      const { lastReadAt } = ctx.request.body;

      ctx.assert(Number.isInteger(lastReadAt), 400, `Could not parse 'lastReadAt' timestamp`);

      const newBookmark = { ...currentBookmark, lastReadAt };
      const newBookmarks = utils.replaceItemAtIndex(
        bookmarks,
        currentBookmarkIndex,
        newBookmark,
      );
      collection.set('bookmarks', newBookmarks);

      await collection.save();

      ctx.body = newBookmark;
    },
  ),
);

app.use(
  route.get(
    '/series/:seriesUrl',
    async (ctx, seriesUrl) => {
      ctx.assert(utils.isUrl(seriesUrl), 400);
      ctx.body = await poketo.getSeries(seriesUrl);
    },
  ),
);

app.use(
  route.get(
    '/series/:siteId/:seriesSlug',
    async (ctx, siteId, seriesSlug) => {
      const seriesUrl = poketo.constructUrl(siteId, seriesSlug);
      ctx.body = await poketo.getSeries(seriesUrl);
    },
  ),
);

app.use(
  route.get(
    '/chapter/:chapterUrl',
    async (ctx, chapterUrl) => {
      ctx.assert(utils.isUrl(chapterUrl), 400);
      ctx.body = await poketo.getChapter(chapterUrl);
    },
  )
);

app.use(
  route.get(
    '/chapter/:siteId/:seriesSlug/:chapterSlug',
    async (ctx, siteId, seriesSlug, chapterSlug) => {
      const chapterUrl = poketo.constructUrl(siteId, seriesSlug, chapterSlug);
      ctx.body = await poketo.getChapter(chapterUrl);
    },
  ),
);

/**
 * Server
 */

const PORT = process.env.PORT || 3001;

app.listen(PORT);
console.log(`> Listening on http://localhost:${PORT}`)

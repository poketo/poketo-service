// @flow

import Koa from 'koa';
import route from 'koa-route';
import bodyparser from 'koa-bodyparser';
import cors from '@koa/cors';

import pmap from 'p-map';
import normalizeUrl from 'normalize-url';
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
 * POST   (missing) /collection/:slug/series/new
 * DELETE (missing) /collection/:slug/series/:seriesId
 * GET    /collection/:slug/series/:seriesId/markAsRead
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
    const { series } = ctx.request.body;

    ctx.assert(Array.isArray(series), 400, `Collection 'series' must be an array`);
    ctx.assert(series.length > 0, 400, `Collection 'series' must have at least one series`);

    const newCollection = new Collection({
      slug: shortid.generate(),
      series
    });

    await newCollection.save();

    ctx.body = newCollection;
  }),
);

app.use(
  route.get('/collection/:slug', async (ctx, slug) => {
    const collection = await Collection.findOne({ slug });
    ctx.assert(collection, 404);
    const collectionSeries = collection.get('series');

    const series = await pmap(
      collectionSeries,
      series => poketo.getSeries(series.url),
      { concurrency: 3 },
    );

    const sortedSeries = series
      .slice()
      .sort((a, b) => b.updatedAt - a.updatedAt);

    ctx.body = {
      collection: {
        slug: collection.get('slug'),
        bookmarks: collection.get('series').map(s => ({
          // TODO: temporary fix until we're saving IDs in the DB
          id: series.find(ss => normalizeUrl(ss.url) === normalizeUrl(s.url)).id,
          url: s.url,
          lastReadAt: s.lastReadAt,
          linkTo: s.linkTo,
        })),
      },
      series: sortedSeries,
    };
  }),
);

app.use(
  route.get(
    '/collection/:slug/markAsRead/:seriesSlug',
    async (ctx, slug, seriesSlug) => {
      const collection = await Collection.findOne({ slug });
      ctx.assert(collection, 404);

      const collectionSeries = collection.get('series');
      const currentSeriesIndex = collectionSeries.findIndex(series => series.slug === seriesSlug);
      const currentSeries = collectionSeries[currentSeriesIndex];
      ctx.assert(currentSeriesIndex !== -1, 404);

      const lastReadAt = Math.round(Date.now() / 1000);

      const newSeries = { ...currentSeries, lastReadAt };
      const newCollectionSeries = utils.replaceItemAtIndex(collectionSeries, currentSeriesIndex, newSeries);
      collection.set('series', newCollectionSeries);

      await collection.save();

      ctx.body = newSeries;
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

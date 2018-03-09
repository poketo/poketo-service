// @flow

import Koa from 'koa';
import route from 'koa-route';
import bodyparser from 'koa-bodyparser';
import cors from '@koa/cors';

import pmap from 'p-map';
import normalizeUrl from 'normalize-url';
import shortid from 'shortid';

import poketo from './api';
import db, { Bookshelf } from './db';
import utils from './utils';

const app = new Koa();

app.use(cors());
app.use(bodyparser());

/**
 * Routes
 *
 * GET    /
 * POST   /bookshelf/new
 * GET    /bookshelf/:slug
 * POST   /bookshelf/:slug/series/new
 * DELETE /bookshelf/:slug/series/:seriesId
 * GET    /bookshelf/:slug/series/:seriesId/markAsRead
 * GET    /series/:id
 * GET    /chapter/:id
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

    const newCollection = new Bookshelf({
      slug: shortid.generate(),
      series
    });

    await newCollection.save();

    ctx.body = newCollection;
  }),
);

app.use(
  route.get('/collection/:collectionSlug', async (ctx, collectionSlug) => {
    const collection = await Bookshelf.findOne({ slug: collectionSlug });
    ctx.assert(collection, 404);
    const collectionSeries = collection.get('series');

    const result = await pmap(
      collectionSeries,
      async series => {
        const metadata = await poketo.getSeries(series.url);
        return { ...series, ...metadata };
      },
      { concurrency: 3 },
    );

    const sortedResult = result
      .slice()
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    ctx.body = sortedResult;
  }),
);

app.use(
  route.post('/collection/:collectionSlug/add', async (ctx, collectionSlug) => {
    const collection = await Bookshelf.findOne({ slug: collectionSlug });
    const { url } = ctx.request.body;

    ctx.assert(collection, 404);
    ctx.assert(url, 400, `No 'url' given`);

    const normalizedUrl = normalizeUrl(url);

    const collectionSeries = collection.get('series');
    const duplicateSeries = collectionSeries.some(series => normalizeUrl(series.url) === normalizedUrl);

    ctx.assert(duplicateSeries, 204, `Series with url '${url}' already added to the collection`);

    // TODO: add slug here, make a test request to the server to see if it's valid
    const newSeries = { url, lastReadAt: null };
    collectionSeries.push(newSeries);
    collection.set('series', collectionSeries);

    await collection.save();

    ctx.body = collectionSeries;
  }),
);

app.use(
  route.delete(
    '/collection/:collectionSlug/series/:seriesId',
    async (ctx, collectionSlug, seriesId) => {
      const collection = await Bookshelf.findOne({ slug: collectionSlug });
      ctx.assert(collection, 404);

      const collectionSeries = collection.get('series');
      const index = collectionSeries.findIndex(series => series.slug === seriesId);
      ctx.assert(index !== -1, 404);

      const newCollectionSeries = utils.deleteItemAtIndex(collectionSeries, index);
      collection.set('series', collectionSeries);

      await collection.save();

      ctx.status = 204;
    },
  ),
);

app.use(
  route.get(
    '/collection/:collectionSlug/series/:seriesId/:chapterSlug+',
    async (ctx, collectionSlug, seriesId, chapterId) => {
      const collection = await Bookshelf.findOne({ slug: collectionSlug });
      ctx.assert(collection, 404);

      const collectionSeries = collection.get('series');
      const currentSeries = collectionSeries.find(series => series.slug === seriesId);
      ctx.assert(currentSeries, 404);

      ctx.body = await poketo.getChapter(currentSeries.url);;
    },
  ),
);

app.use(
  route.get(
    '/collection/:collectionSlug/markAsRead/:seriesId',
    async (ctx, collectionSlug, seriesId) => {
      const collection = await Bookshelf.findOne({ slug: collectionSlug });
      ctx.assert(collection, 404);

      const collectionSeries = collection.get('series');
      const currentSeriesIndex = collectionSeries.findIndex(series => series.slug === seriesId);
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
      ctx.assert(seriesUrl.length > 0, 400);
      ctx.assert(utils.isUrl(seriesUrl), 400);

      ctx.body = await poketo.getSeries(seriesUrl);
    },
  ),
);

app.use(
  route.get(
    '/chapter/:chapterUrl',
    async (ctx, chapterUrl) => {
      ctx.assert(chapterUrl.length > 0, 400);
      ctx.assert(utils.isUrl(chapterUrl), 400);

      ctx.body = await poketo.getChapter(chapterUrl);
    },
  )
)

/**
 * Server
 */

const PORT = process.env.PORT || 3001;

app.listen(PORT);
console.log(`> Listening on http://localhost:${PORT}`)

import got from 'got';
import cheerio from 'cheerio';
import map from 'p-map';
import shortid from 'shortid';
import normalizeUrl from 'normalize-url';
import hash from 'rev-hash';

import Koa from 'koa';
import route from 'koa-route';
import bodyparser from 'koa-bodyparser';
import cors from '@koa/cors';
import assert from 'http-assert';

import api from './api';
import db from './db';

const app = new Koa();

app.use(cors());
app.use(bodyparser());

/**
 * Routes
 */

app.use(
  route.get('/', async ctx => {
    ctx.body = '🔖';
  }),
);

app.use(
  route.post('/collection/new', async ctx => {
    const { name, series } = ctx.request.body;

    assert(name, 400, `No 'name' given for the collection`);
    assert(Array.isArray(series), 400, `Collection 'series' must be an array`);
    assert(series.length > 0, 400, `Collection 'series' must have at least one series`);

    const id = shortid.generate();
    const newCollection = { id, series };

    db
      .get('collections')
      .push(newCollection)
      .write();

    ctx.body = newCollection;
  }),
);

app.use(
  route.get('/collection/:id', async (ctx, id) => {
    const _collection = db.get('collections').getById(id);
    const _series = _collection.get('series');

    assert(_collection.value(), 404);

    const result = await map(
      _series.value(),
      async series => {
        const metadata = await api.getSeriesMetadata(series.url);
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
  route.post('/collection/:collectionId/add', async (ctx, collectionId) => {
    const _collection = db.get('collections').getById(collectionId);
    const { url } = ctx.request.body;

    assert(_collection.value(), 404);
    assert(url, 400, `No 'url' given`);

    const normalizedUrl = normalizeUrl(url);
    const id = hash(normalizedUrl);

    const _series = _collection.get('series');
    const duplicateSeries = _series.getById(id).value();
    const noDuplicateSeries = duplicateSeries === null || duplicateSeries === undefined;

    assert(noDuplicateSeries, 204, `Series with url '${url}' already added to the collection`);

    const series = { id, url, lastReadAt: null };

    _series
      .push(series)
      .write();

    ctx.body = _series.value();
  }),
);

app.use(
  route.delete(
    '/collection/:collectionId/series/:mangaId',
    async (ctx, collectionId, mangaId) => {
      const _collection = db.get('collections').getById(collectionId);
      const _series = _collection.get('series').getById(mangaId);
    },
  ),
);

app.use(
  route.get(
    '/collection/:collectionId/series/:seriesId/:chapterId+',
    async (ctx, collectionId, seriesId, chapterId) => {
      const _collection = db.get('collections').getById(collectionId);
      const _series = _collection.get('series').find({ slug: seriesId });

      assert(_collection.value(), 404);
      assert(_series.value(), 404);

      const result = await api.getSeriesChapter(_series.get('site').value(), seriesId, chapterId);

      ctx.body = result;
    },
  ),
);

app.use(
  route.get(
    '/collection/:collectionId/markAsRead/:mangaId',
    async (ctx, collectionId, mangaId) => {
      const _collection = db.get('collections').getById(collectionId);
      const _series = _collection.get('series').getById(mangaId);

      assert(_collection.value(), 404);
      assert(_series.value(), 404);

      const lastReadAt = Math.round(Date.now() / 1000);

      _series.assign({ lastReadAt }).write();

      ctx.body = _series.value();
    },
  ),
);


const PORT = process.env.PORT || 3001;

app.listen(PORT);
console.log(`> Listening on http://localhost:${PORT}`)

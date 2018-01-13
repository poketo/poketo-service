const got = require('got');
const cheerio = require('cheerio');
const moment = require('moment-timezone');
const map = require('p-map');
const low = require('lowdb');
const shortid = require('shortid');
const FileSync = require('lowdb/adapters/FileSync')

const Koa = require('koa');
const route = require('koa-route');
const bodyparser = require('koa-bodyparser');
const cors = require('@koa/cors');
const assert = require('http-assert');

const TIMEZONE = 'America/Los_Angeles';

const app = new Koa();

const adapter = new FileSync('.data/db.json');
const db = low(adapter);

db._.mixin(require('lodash-id'));
db.defaults({ collections: [] }).write();

app.use(cors())
app.use(bodyparser());

function toTimestamp (dateString) {
  return moment.tz(dateString, 'MM/DD/YY', TIMEZONE).unix();
}

async function fetchMangaMetadata (id) {
  const res = await got(`https://www.mangaupdates.com/releases.html?search=${id}&stype=series`);
  const html = res.body;
  const dom = cheerio.load(html);
  
  const title = dom('td.text.pad[bgcolor]:nth-child(2)', '#main_content').first().text();
  const updatedAtDate = dom('td.text.pad[bgcolor]:nth-child(1)', '#main_content').first().text();
  const updatedAt = toTimestamp(updatedAtDate);
  
  return { id, title, updatedAt };
}

/**
 * Routes
 */

app.use(route.get('/', async ctx => {
  ctx.body = '🔖';
}));

app.use(route.get('/manga/:id', async (ctx, id) => {
  ctx.body = await fetchMangaMetadata(id);
}));

app.use(route.post('/collection/new', async ctx => {
  const { name, series } = ctx.request.body;
  
  assert(name, 400, `No 'name' given for the collection`);
  assert(Array.isArray(series), 400, `Collection 'series' must be an array`);
  assert(series.length > 0, 400, `Collection 'series' must have at least one series`);
  
  const id = shortid.generate();
  const newCollection = { id, series };
  
  db.get('collections').push(newCollection).write();
  
  ctx.body = newCollection;
}));

app.use(route.get('/collection/:id', async (ctx, id) => {
  const collection = db.get('collections').getById(id);
  assert(collection.value(), 404);
  
  const series = collection.get('series');
  const seriesArray = series.value();
  
  const result = await map(seriesArray, async manga => {
    const metadata = await fetchMangaMetadata(manga.id);
    return { ...manga, ...metadata };
  }, { concurrency: 3 });
  
  const sortedResult = result.slice().sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  
  ctx.body = sortedResult;
}));

app.use(route.post('/collection/:collectionId/add', async (ctx, collectionId) => {
  const collection = db.get('collections').getById(collectionId);
  assert(collection.value(), 404);
  
  const { id, linkToUrl } = ctx.request.body;
  
  assert(id, 400, `No 'id' given`);
  assert(linkToUrl, 400, `No 'linkToUrl' given`);
  
  const seriesList = collection.get('series');
  const manga = seriesList.getById(id).value();
  
  assert(manga === null || manga === undefined, 204, `Series with id '${id}' already added to the collection!`);
  
  seriesList
    .push({ id, linkToUrl, readAt: null })
    .write();
  
  ctx.body = seriesList.value();
}));

app.use(route.delete('/collection/:collectionId/series/:mangaId', async (ctx, collectionId, mangaId) => {
  const collection = db.get('collections').getById(collectionId);
  const seriesList = collection.get('series').getById(mangaId);
}));

app.use(route.get('/collection/:collectionId/markAsRead/:mangaId', async (ctx, collectionId, mangaId) => {
  const collection = db.get('collections').getById(collectionId);
  const series = collection.get('series').getById(mangaId);
  
  assert(collection.value(), 404);
  assert(series.value(), 404);
  
  const readAt = Math.round(Date.now() / 1000);
  
  series.assign({ readAt }).write();
  
  ctx.body = series.value();
}));

app.listen(process.env.PORT);
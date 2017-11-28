const got = require('got');
const cheerio = require('cheerio');
const moment = require('moment-timezone');
const map = require('p-map');
const low = require('lowdb');
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

const dbb = {
  collections: [
    {
      id: 'ef202cef202c',
      series: [
        { id: '1370212', lastRead }
      ]
    }
  ]
}

app.use(route.get('/', async ctx => {
  ctx.body = '🔖';
}));

app.use(route.get('/manga/:id', async (ctx, id) => {
  ctx.body = await fetchMangaMetadata(id);
}));

app.use(route.get('/collections', async ctx => {
  ctx.body = db.get('collections').value();
}));

app.use(route.get('/collection/:id', async (ctx, id) => {
  ctx.body = db.get('collections').find({ id }).value();
}));

app.use(route.post('/collections/new', async ctx => {
  assert(ctx.request.body.name, 400, `No 'name' given for the collection`);
  assert(Array.isArray(ctx.request.body.series), 400, `Collection 'series' must be an array`);
  assert(ctx.request.body.series.length > 0, 400, `Collection 'series' must have at least one series`);
  
  
}));

app.use(route.post('/collection/:collectionId/markAsRead/:mangaId', async (ctx, collectionId, mangaId) => {
  db.get('collections')
    .find({ id: collectionId })
    .assign({ name: 'Read!' })
    .write();
}));

app.listen(process.env.PORT);
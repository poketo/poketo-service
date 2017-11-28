const got = require('got');
const cheerio = require('cheerio');
const moment = require('moment-timezone');
const map = require('p-map');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync')

const Koa = require('koa');
const route = require('koa-route');
const cors = require('@koa/cors');

const TIMEZONE = 'America/Los_Angeles';

const app = new Koa();

const adapter = new FileSync('.data/db.json');
const db = low(adapter);

db.defaults({ collections: [] }).write();

app.use(cors())

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

app.use(route.get('/manga/:id', async (ctx, id) => {
  ctx.body = await fetchMangaMetadata(id);
}));

app.use(route.get('/collections', async ctx => {
  ctx.body = db.get('collections').value();
}));

app.use(route.get('/collection/:id', async (ctx, id) => {
  ctx.body = `Hello ${id}`;
}));

app.use(route.post('/collections/new', async ctx => {
  
}));

app.use(route.post('/collection/:collectionId/read/:mangaId', async (ctx, collectionId, mangaId) => {
  
}));

app.listen(process.env.PORT);
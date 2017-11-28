const got = require('got');
const cheerio = require('cheerio');
const map = require('p-map');

const Koa = require('koa');
const route = require('koa-route');
const cors = require('@koa/cors');

const app = new Koa();

const SELECTOR_TITLE = '#main_content > table > tbody > tr:nth-child(3) > td > table > tbody > tr:nth-child(1) > td > table > tbody > tr:nth-child(3) > td:nth-child(2)';
const SELECTOR_UPDATED_AT = '#main_content > table > tbody > tr:nth-child(3) > td > table > tbody > tr:nth-child(1) > td > table > tbody > tr:nth-child(3) > td:nth-child(1)';

app.use(cors())

const toTimestamp = str => (new Date(Date.parse(str))).valueOf();

async function fetchManga (id) {
  const res = await got(`https://www.mangaupdates.com/releases.html?search=${id}&stype=series`);
  const html = res.body;
  const dom = cheerio.load(html);
  
  const title = dom(SELECTOR_TITLE).text();
  const updatedAtDate = dom(SELECTOR_UPDATED_AT).text();
  const updatedAt = toTimestamp(updatedAtDate);
  
  console.log(title);
  
  return { id, title, updatedAt };
}

app.use(route.get('/manga/:id', async (ctx, id) => {
  const results = await fetchManga(id);
  ctx.body = results;
}));

app.listen(process.env.PORT);

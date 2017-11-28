const got = require('got');
const cheerio = require('cheerio');
const moment = require('moment');
const map = require('p-map');

const Koa = require('koa');
const route = require('koa-route');
const cors = require('@koa/cors');

const app = new Koa();

app.use(cors())

const toTimestamp = dateString => moment(dateString, 'MM/DD/YY').unix();

async function fetchMangaMetadata (id) {
  const res = await got(`https://www.mangaupdates.com/releases.html?search=${id}&stype=series`);
  const html = res.body;
  const dom = cheerio.load(html);
  
  const title = dom('td.text.pad[bgcolor]:nth-child(2)', '#main_content').first().text();
  const updatedAtDate = dom('td.text.pad[bgcolor]:nth-child(1)', '#main_content').first().text();
  const updatedAt = toTimestamp(updatedAtDate);
  
  return { id, title, updatedAt };
}

app.use(route.get('/manga/:id', async (ctx, id) => {
  ctx.body = await fetchMangaMetadata(id);
}));

app.listen(process.env.PORT);

const got = require('got');
const cheerio = require('cheerio');
const map = require('p-map');

const Koa = require('koa');
const route = require('koa-route');
const cors = require('@koa/cors');

const app = new Koa();

app.use(cors())

const toTimestamp = str => (new Date(Date.parse(str))).valueOf();

async function fetchManga (id) {
  const res = await got(`https://www.mangaupdates.com/releases.html?search=${id}&stype=series`);
  const html = res.body;
  const dom = cheerio.load(html);
  
  const title = dom('td.text.pad[bgcolor]:nth-child(2)', '#main_content').text();
  const updatedAtDate = dom('td.text.pad[bgcolor]:nth-child(1)', '#main_content').text();
  const updatedAt = toTimestamp(updatedAtDate);
  
  console.log(dom('#main_content > table > tbody > tr:nth-child(3) > td > table > tbody > tr:nth-child(1) > td > table > tbody > tr:nth-child(3)').text());
  
  return { id, title, updatedAt };
}

app.use(route.get('/manga/:id', async (ctx, id) => {
  const results = await fetchManga(id);
  ctx.body = results;
}));

fetchManga(130971).then(res => console.log(res));

app.listen(process.env.PORT);

const got = require('got');
const cheerio = require('cheerio');
const map = require('p-map');

const Koa = require('koa');
const cors = require('@koa/cors');

const app = new Koa();

const selectors = {
  title: '#main_content > table > tbody > tr:nth-child(3) > td > table > tbody > tr:nth-child(1) > td > table > tbody > tr:nth-child(3) > td:nth-child(2)',
  updatedAt: '#main_content > table > tbody > tr:nth-child(3) > td > table > tbody > tr:nth-child(1) > td > table > tbody > tr:nth-child(3) > td:nth-child(1)',
};

app.use(cors())

const toTimestamp = str => (new Date(Date.parse(str))).valueOf();

async function fetchManga (id) {
  const res = await got(`https://www.mangaupdates.com/releases.html?search=${id}&stype=series`);
  const html = res.body;
  const dom = cheerio.load(html);
  
  const title = dom(selectors.title).text();
  const updatedAtDate = dom(selectors.updatedAt).text();
  const updatedAt = toTimestamp(updatedAtDate);
  
  console.log(dom(selectors.title));
  
  return { id, title, updatedAt };
}

app.get('/manga/:mangaId', async ctx => {
  const results = await fetchManga(req.params.mangaId);
  ctx.body.json(results);
});

app.listen(process.env.PORT);

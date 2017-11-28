const got = require('got');
const cheerio = require('cheerio');
const map = require('p-map');
const cors = require('cors');

const express = require('express');
const app = express();

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
  
  console.log(title, updatedAtDate);
  
  return { id, title, updatedAt };
}

app.get('/manga/:mangaId', async (req, res) => {
  const results = await fetchManga(req.params.mangaId);
  res.json(results);
});

const listener = app.listen(process.env.PORT, () => {
  console.log(`Your app is listening on port ${listener.address().port}`);
});

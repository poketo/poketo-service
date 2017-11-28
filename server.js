const got = require('got');
const cheerio = require('cheerio');
const map = require('p-map');

const express = require('express');
const app = express();

const UPDATED_AT_SELECTOR = '#main_content > table > tbody > tr:nth-child(3) > td > table > tbody > tr:nth-child(1) > td > table > tbody > tr:nth-child(3) > td:nth-child(1)';

app.get('/', (req, res) => {
  res.sendStatus(404);
});

async function checkUpdatedAt (id) {
  const res = await got(`https://www.mangaupdates.com/releases.html?search=${id}&stype=series`);
  const html = res.body;
  const dom = cheerio.load(html);
  
  const updatedAt = dom(UPDATED_AT_SELECTOR).text();
  const timestamp = (new Date(Date.parse(updatedAt))).valueOf();
  
  return timestamp;
}

app.get('/:mangaId', (req, res) => {
  res.send(dreams);
});

app.listen(process.env.PORT, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});

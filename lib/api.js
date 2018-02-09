const got = require('got');
const cheerio = require('cheerio');

async function getPageHtml(url) {
  const res = await got(url);
  const html = res.body;
  const dom = cheerio.load(html);
};
// @flow

// Series URLs
// http://merakiscans.com/senryu-girl/
// http://merakiscans.com/ninja-shinobu-san-no-junjou/

// Reader URLs
// http://merakiscans.com/senryu-girl/2/

// Uses GlossyBright WordPress plugin / theme.

import cheerio from 'cheerio';
import moment from 'moment-timezone';
import pmap from 'p-map';
import utils from '../utils';

import type { SiteAdapter, ChapterPreview } from '../types';

function getPage(url, i) {
  return utils.getImageSize(url).then(({ width, height}) => ({
    id: i,
    url,
    width,
    height,
  }));
}

const MerakiScansAdapter: SiteAdapter = {
  supportsUrl(url) {
    return utils.compareDomain(url, 'http://merakiscans.com/');
  },

  supportsReading () {
    return true;
  },

  async getSeriesMetadata(seriesId) {
    const rss = await utils.getPage(`http://merakiscans.com/manga-rss/${seriesId}`);
    const xml = cheerio.load(rss, { xmlMode: true });

    const rssTitle = xml('image > title', 'channel');
    const rssChapters = xml('item', 'channel');

    const [,title] = /^Recent chapters of (.*?) manga$/.exec(rssTitle.text().trim());
    const chapters: Array<ChapterPreview> = rssChapters.map((i, el) => {
      const createdAtText = xml(el).find('pubDate').text();
      const chapterIdText = xml(el).find('link').text().trim();

      const createdAt = moment.tz(createdAtText, 'dddd, D MMM YYYY, HH:mm:ss', 'America/Los_Angeles').unix();
      const [,chapterId] = /\/([\d\.]+)\/\d+\/?$/.exec(chapterIdText);

      return { id: chapterId, createdAt };
    }).get().sort((a, b) => b.createdAt - a.createdAt);

    const updatedAt = chapters.reduce((a, b) => Math.max(a, b.createdAt), 0);

    return { slug: seriesId, title, chapters, updatedAt };
  },

  async getSeriesChapter(seriesId, chapterId) {
    const html = await utils.getPage(`http://merakiscans.com/${seriesId}/${chapterId}`);
    const dom = cheerio.load(html);
    const imageUrls = dom('img', '#longWrap').map((_, el) => dom(el).attr('src')).get();
    const pages = await pmap(imageUrls, getPage, { concurrency: 3 });

    return { id: chapterId, seriesId, pages };
  },
};

export default MerakiScansAdapter;

// @flow

import assert from 'assert';
import cheerio from 'cheerio';
import moment from 'moment-timezone';
import pmap from 'p-map';
import utils from '../utils';

import type { SiteAdapter, ChapterPreview } from '../types';

function getPage(url, i) {
  return utils.getImageSize(url).then(({ width, height }) => ({
    id: i,
    url,
    width,
    height,
  }));
}

// Series URLs
// http://merakiscans.com/senryu-girl/
// http://merakiscans.com/ninja-shinobu-san-no-junjou/

// Reader URLs
// http://merakiscans.com/senryu-girl/2/

const MerakiScansAdapter: SiteAdapter = {
  id: utils.getSiteId('meraki-scans'),
  name: 'Meraki Scans',

  supportsUrl(url) {
    return utils.compareDomain(url, 'http://merakiscans.com/');
  },

  supportsReading () {
    return true;
  },

  parseUrl(url) {
    const matches = utils.pathMatch(url, '/:seriesSlug/:chapterSlug?(\/.+)?');

    assert(matches !== null, `Could not parse url ${url}`);
    assert(matches.seriesSlug, `Could not parse url ${url}`);

    const { seriesSlug, chapterSlug = null } = matches;

    return { seriesSlug, chapterSlug };
  },

  constructUrl(seriesSlug, chapterSlug) {
    const url = [
      'http://merakiscans.com',
      seriesSlug,
      chapterSlug,
    ].filter(Boolean).join('/');

    return utils.normalizeUrl(url);
  },

  async getSeries(seriesSlug) {
    const rss = await utils.getPage(`http://merakiscans.com/manga-rss/${seriesSlug}`);
    const xml = cheerio.load(rss, { xmlMode: true });

    const rssTitle = xml('image > title', 'channel');
    const rssChapters = xml('item', 'channel');

    const [,title] = /^Recent chapters of (.*?) manga$/.exec(rssTitle.text().trim());
    const chapters: Array<ChapterPreview> = rssChapters.get().map(el => {
      const createdAtText = xml(el).find('pubDate').text();
      const chapterSlugText = xml(el).find('link').text().trim();

      const createdAt = moment.tz(createdAtText, 'dddd, D MMM YYYY, HH:mm:ss', 'America/Los_Angeles').unix();
      const [,chapterSlug] = /\/([\d\.]+)\/\d+\/?$/.exec(chapterSlugText);
      const chapterUrl = this.constructUrl(seriesSlug, chapterSlug);
      const chapterId = utils.getChapterId(chapterUrl);

      return { id: chapterId, slug: chapterSlug, url: chapterUrl, createdAt };
    }).sort((a, b) => b.createdAt - a.createdAt);

    const seriesUrl = this.constructUrl(seriesSlug);
    const seriesId = utils.getSeriesId(seriesUrl);
    const updatedAt = chapters.reduce((a, b) => Math.max(a, b.createdAt), 0);

    return { id: seriesId, slug: seriesSlug, url: seriesUrl, title, chapters, updatedAt };
  },

  async getChapter(seriesSlug, chapterSlug) {
    const chapterUrl = this.constructUrl(seriesSlug, chapterSlug);
    const chapterId = utils.getChapterId(chapterUrl);
    const seriesId = utils.getSeriesId(this.constructUrl(seriesSlug));

    const html = await utils.getPage(chapterUrl);
    const dom = cheerio.load(html);
    const imageUrls = dom('img', '#longWrap').get().map(el => dom(el).attr('src'));
    const pages = await pmap(imageUrls, getPage, { concurrency: 3 });

    return { id: chapterId, slug: chapterSlug, url: chapterUrl, seriesId, pages };
  },
};

export default MerakiScansAdapter;

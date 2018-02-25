// @flow

// http://www.mangahere.cc/manga/<series-id>/
// http://www.mangahere.cc/manga/<series-id>/<chapter-id>/1.html
// http://www.mangahere.cc/manga/urami_koi_koi_urami_koi/c038/2.html

import { URL } from 'url';
import cheerio from 'cheerio';
import moment from 'moment-timezone';
import pmap from 'p-map';
import utils from '../utils';

import type { SiteAdapter, ChapterPreview, Page } from '../types';

async function getPage(pageUrl): Promise<Page> {
  // NOTE: they return the current page image and the next page image in
  // the same HTML body. We could halve the time it takes to get the
  // images by using both.
  const html = await utils.getPage(pageUrl);
  const dom = cheerio.load(html);

  const url = new URL(pageUrl);
  const id: string = url.pathname.split('/').pop();
  const imageUrl: string = dom('#image').attr('src');
  // const width = dom('#image').attr('width');

  return { id, url: imageUrl };
}

const MangaHereAdapter: SiteAdapter = {
  supportsUrl(url) {
    return /^https?:\/\/(www\.)?mangahere.(co|cc)/.test(url);
  },

  supportsReading() {
    return true;
  },

  async getSeriesMetadata(seriesId) {
    const html = await utils.getPage(`http://www.mangahere.cc/manga/${seriesId}/`);
    const dom = cheerio.load(html);

    const title = dom('meta[property="og:title"]', 'head').attr('content').trim();
    const chapters: Array<ChapterPreview> = [];
    const updatedAtRawText = dom('ul li .right', '.manga_detail .detail_list').first().text();
    const updatedAt = moment.tz(updatedAtRawText, 'MMM D, YYYY', 'America/Los_Angeles').unix();

    return { slug: seriesId, title, chapters, updatedAt };
  },

  async getSeriesChapter(seriesId, chapterId) {
    const sourceUrl = `http://m.mangahere.cc/manga/${seriesId}/${chapterId}/`;
    const body = await utils.getPage(sourceUrl);
    const dom = cheerio.load(body);

    const pageUrls = dom('select.mangaread-page').first().find('option').get()
      .map(el => `http:${dom(el).attr('value')}`)
      .filter(url => url.indexOf('featured.html') === -1);

    const pages: Array<Page> = await pmap(pageUrls, getPage, { concurrency: 1 });

    return { id: chapterId, seriesId, sourceUrl, pages };
  },
};

export default MangaHereAdapter;

// @flow

// http://www.mangahere.cc/manga/<series-id>/
// http://www.mangahere.cc/manga/<series-id>/<chapter-id>/1.html
// http://www.mangahere.cc/manga/urami_koi_koi_urami_koi/c038/2.html

import { URL } from 'url';
import cheerio from 'cheerio';
import moment from 'moment-timezone';
import throttle from 'p-throttle';
import utils from '../utils';

import type { SiteAdapter, ChapterPreview, Page } from '../types';

async function getPage (pageUrl): Promise<Array<Page>> {
  const html = await utils.getPage(pageUrl);
  const dom = cheerio.load(html);

  const imageUrls = [
    dom('#image').attr('src'),
    dom('.tsuk-control + img', '.site-content').attr('src'),
  ].filter(Boolean).map(imageUrl => {
    const url = new URL(imageUrl);
    const id: string = url.pathname.split('/').pop();

    return { id, url: imageUrl };
  });

  return imageUrls;
}

const throttledGetPage = throttle(getPage, 1, 300);

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
    const updatedAtRawText = dom('ul li .right', '.manga_detail .detail_list').first().text();
    const updatedAt = moment.tz(updatedAtRawText, 'MMM D, YYYY', 'America/Los_Angeles').unix();

    const chapters: Array<ChapterPreview> = dom('.title + ul > li', '.manga_detail > .detail_list').get().map(el => {
      const href = dom(el).find('a:first-child', '.left').attr('href');
      const id = href.match(/\/(c\d+)\/?$/)[1];
      const createdAtRawText = dom(el).find('.right').text().trim();
      const createdAt = moment.tz(createdAtRawText, 'MMM D, YYYY', 'America/Los_Angeles').unix();

      return { id, createdAt };
    });;

    return { slug: seriesId, title, chapters, updatedAt };
  },

  async getSeriesChapter(seriesId, chapterId) {
    const sourceUrl = `http://m.mangahere.cc/manga/${seriesId}/${chapterId}/`;
    const body = await utils.getPage(sourceUrl);
    const dom = cheerio.load(body);

    const pageUrls = dom('select.mangaread-page').first().find('option').get()
      .map(el => `http:${dom(el).attr('value')}`)
      .filter(url => url.indexOf('featured.html') === -1);

    // NOTE: MangaHere returns an image url for the next page, so to halve the
    // loading time from fetching every page, we just grab every other page.
    const everyOtherPageUrl = pageUrls.filter((_, i) => i % 2 === 0);

    // NOTE: They also rate-limit requests to once every 250ms from an IP. We
    // use the throttled version here as to avoid this.
    const nestedPages = await Promise.all(everyOtherPageUrl.map(throttledGetPage));
    const pages: Array<Page> = utils.flatten(nestedPages);

    return { id: chapterId, seriesId, sourceUrl, pages };
  },
};

export default MangaHereAdapter;

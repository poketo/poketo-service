// @flow

import assert from 'assert';
import cheerio from 'cheerio';
import moment from 'moment-timezone';
import throttle from 'p-throttle';
import utils from '../utils';

import type { SiteAdapter, ChapterPreview, Page } from '../types';

const TZ = 'America/Los_Angeles';

function getTimestamp (rawText) {
  const text = rawText.toLowerCase();
  if (text === 'today') {
    return moment.tz(TZ).endOf('day').unix();
  } else if (text === 'yesterday') {
    return moment.tz(TZ).subtract(1, 'day').endOf('day').unix();
  }

  return moment.tz(text, 'MMM D, YYYY', 'America/Los_Angeles').unix();
}

function getChapterNumber (input: string): ?string {
  const matches = /\s+(\d+)$/i.exec(input);

  if (matches === null) {
    return null;
  }

  return matches.length > 1 ? matches[1] : null;
}

const throttledGetPage = throttle(utils.getPage, 1, 600);

// http://www.mangahere.cc/manga/<series-id>/
// http://www.mangahere.cc/manga/<series-id>/<chapter-id>/1.html
// http://www.mangahere.cc/manga/urami_koi_koi_urami_koi/c038/2.html

const MangaHereAdapter: SiteAdapter = {
  id: utils.getSiteId('manga-here'),
  name: 'Manga Here',

  supportsUrl(url) {
    return /^https?:\/\/(www\.)?mangahere.(co|cc)/.test(url);
  },

  supportsReading() {
    return true;
  },

  parseUrl(url) {
    const matches = utils.pathMatch(url, '/manga/:seriesSlug/:chapterSlug(c[0-9\.]+)?(\/.+)?');

    assert(matches !== null, 'Could not parse url');
    assert(matches.seriesSlug, 'Could not parse url');

    const { seriesSlug, chapterSlug = null } = matches;

    return { seriesSlug, chapterSlug };
  },

  constructUrl(seriesSlug, chapterSlug) {
    return utils.normalizeUrl(`http://mangahere.cc/manga/${seriesSlug}/${chapterSlug || ''}`);
  },

  async getSeries(seriesSlug) {
    const sourceUrl = this.constructUrl(seriesSlug);
    const html = await throttledGetPage(sourceUrl);
    const dom = cheerio.load(html);

    const seriesId = utils.getSeriesId(sourceUrl);
    const title = dom('meta[property="og:title"]', 'head').attr('content').trim();
    const updatedAtRawText = dom('ul li .right', '.manga_detail .detail_list').first().text();
    const updatedAt = getTimestamp(updatedAtRawText);

    const chapters: Array<ChapterPreview> = dom('.title + ul > li', '.manga_detail > .detail_list').get().map(el => {
      const href = dom(el).find('a:first-child', '.left').attr('href');
      const slug = href.match(/\/(c[\d|\.]+)\/?$/)[1];
      const url = this.constructUrl(seriesSlug, slug);
      const id = utils.getChapterId(url);
      const number = getChapterNumber(dom(el).find('.left > a').text().trim());
      const createdAt = getTimestamp(dom(el).find('.right').text().trim());

      return { id, slug, url, number, createdAt };
    });

    return { id: seriesId, slug: seriesSlug, url: sourceUrl, title, chapters, updatedAt };
  },

  async getChapter(seriesSlug, chapterSlug) {
    const sourceUrl = this.constructUrl(seriesSlug, chapterSlug);
    // NOTE: we request from the mobile site for faster load times
    const requestUrl = sourceUrl.replace(/mangahere\.cc/, 'm.mangahere.cc');
    const body = await utils.getPage(requestUrl);
    const dom = cheerio.load(body);

    const pageUrls = dom('select.mangaread-page').first().find('option').get()
      .map(el => `http:${dom(el).attr('value')}`)
      .filter(url => url.indexOf('featured.html') === -1);

    // NOTE: MangaHere returns an image url for the next page, so to halve the
    // loading time from fetching every page, we just grab every other page.
    const everyOtherPageUrl = pageUrls.filter((_, i) => i % 2 === 0);

    // NOTE: They also rate-limit requests to once every 250ms from an IP. We
    // use the throttled version here as to avoid this.
    const nestedPages = await Promise.all(everyOtherPageUrl.map(async url => {
      const html = await throttledGetPage(url);
      const dom = cheerio.load(html);

      const imageUrls = [
        dom('#image').attr('src'), // current page
        dom('.tsuk-control + img', '.site-content').attr('src'), // next page
      ].filter(Boolean).map(url => {
        const id: string = utils.pathname(url).split('/').pop();
        return { id, url };
      });

      return imageUrls;
    }));
    const pages: Array<Page> = utils.flatten(nestedPages);

    const seriesId = utils.getSeriesId(this.constructUrl(seriesSlug));
    const id = utils.getChapterId(sourceUrl);

    return { id, slug: chapterSlug, url: sourceUrl, seriesId, pages };
  },
};

export default MangaHereAdapter;

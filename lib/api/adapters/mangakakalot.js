// @flow

import assert from 'assert';
import cheerio from 'cheerio';
import moment from 'moment-timezone';
import utils from '../utils';

import type { SiteAdapter, ChapterPreview, Page } from '../types';

const DATE_FORMAT = 'YYYY-MM-DD HH:mm';
const TZ = 'Asia/Hong_Kong';

const getFirstWord = (string: string) => string.split(' ').shift();
const getNumber = (string: string) => parseInt(string, 10);

/**
 * Takes a year and a MM-DD HH:mm timestamp and returns a full unix timestamp.
 */
const getUnixFromTimestamp = (year: number, date: string) =>
  moment.tz(`${year}-${date}`, DATE_FORMAT, TZ).unix();

/**
 * Mangakakalot shows dates in two formats: "19 hour ago" and "12-25 18:09".
 * This function normalizes them to both follow the "MM-DD HH:mm" format.
 */
const normalizeTimestampFormat = (timestamp: string) => {
  if (timestamp.endsWith('ago')) {
    const offset = getNumber(getFirstWord(timestamp));
    const now = moment();
    return now
      .subtract(offset, 'hours')
      .startOf('hour')
      .format('MM-DD HH:mm');;
  }

  return timestamp;
};

/**
 * Mangakakalot shows chapter numbers in a bunch of formats, but the two most
 * common are "Vol.2 Chapter 5" and "Chapter 19". This function extracts the
 * number from all the chapter formats.
 */
const extractChapterNumber = (input: string): ?string => {
  const matches = /chapter\s+([\d\.]+)/i.exec(input);

  if (matches === null) {
    return null;
  }

  return matches.length > 1 ? matches[1] : null;
};


// http://mangakakalot.com/manga/<series-id>
// http://mangakakalot.com/chapter/<series-id>/chapter_<chapter-id>

const MangakakalotAdapter: SiteAdapter = {
  id: utils.getSiteId('mangakakalot'),
  name: 'Mangakakalot',

  supportsUrl(url) {
    return utils.compareDomain(url, 'http://mangakakalot.com');
  },

  supportsReading() {
    return true;
  },

  parseUrl(url) {
    const matches = utils.pathMatch(url, '/:type(manga|chapter)/:seriesSlug/:chapterSlug(chapter_[0-9\.]+)?(\/.+)?');

    assert(matches !== null, 'Could not parse url');
    assert(matches.seriesSlug, 'Could not parse url');

    const seriesSlug = matches.seriesSlug;
    const chapterSlug = matches.type === 'chapter' ? matches.chapterSlug : null;

    return { seriesSlug, chapterSlug };
  },

  constructUrl(seriesSlug, chapterSlug) {
    const isChapter = chapterSlug !== null && chapterSlug !== undefined;

    const parts = [
      'http://mangakakalot.com',
      isChapter ? 'chapter' : 'manga',
      seriesSlug
    ];

    if (isChapter) {
      parts.push(chapterSlug);
    }

    return utils.normalizeUrl(parts.join('/'));
  },

  async getSeries(seriesSlug) {
    const html = await utils.getPage(this.constructUrl(seriesSlug));
    const dom = cheerio.load(html);

    const url = this.constructUrl(seriesSlug);
    const id = utils.getSeriesId(url);
    const title = dom('h1', 'ul.manga-info-text').first().text().trim();

    const updatedAtRawText = dom('li', 'ul.manga-info-text').eq(3).text().trim();
    const updatedAtText = updatedAtRawText.split('Last updated : ').pop();
    const updatedAtTimestamp = moment.tz(updatedAtText, 'MMM-DD-YYYY HH:mm:ss A', TZ);
    const updatedAt = updatedAtTimestamp.unix();

    const chapterRawData = dom('.row', '.chapter-list').get().map(el => {
      const number = extractChapterNumber(dom('a', el).text().trim());
      const href = dom('a', el).attr('href');
      const slug = dom('a', el).attr('href').split('/').pop();
      const url = this.constructUrl(seriesSlug, slug);

      let createdAtText = normalizeTimestampFormat(dom('span', el).eq(2).text().trim());

      return { slug, url, number, createdAtText };
    });

    // NOTE: since Mangakakalot doesn't give the year with a chapter timestamp,
    // we assume the most recent chapter matches the updatedAt timestamp for the
    // series. Then, we work backwards, assuming each chapter was released
    // before later ones.

    let lastUpdatedYear = updatedAtTimestamp.year();

    const chapters: Array<ChapterPreview> = chapterRawData.map((chapterData, i, arr) => {
      const prev = arr[i - 1];
      const { createdAtText, slug, number, url } = chapterData;
      const id = utils.getChapterId(url);

      let createdAt = getUnixFromTimestamp(lastUpdatedYear, createdAtText);

      if (prev) {
        const prevCreatedAt = getUnixFromTimestamp(lastUpdatedYear, prev.createdAtText);

        if (prevCreatedAt < createdAt) {
          lastUpdatedYear -= 1;
          createdAt = moment.unix(createdAt)
            .year(lastUpdatedYear)
            .unix();
        }
      }

      return { id, slug, url, number, createdAt };
    });

    return { id, slug: seriesSlug, url, title, chapters, updatedAt };
  },

  async getChapter(seriesSlug, chapterSlug) {
    const sourceUrl = this.constructUrl(seriesSlug, chapterSlug);
    const html = await utils.getPage(sourceUrl);
    const dom = cheerio.load(html);

    const pages: Array<Page> = dom('img', '#vungdoc').get().map(el => {
      const url = dom(el).attr('src');
      const id = url.split('/').pop().split('_').shift();

      return { id, url };
    });

    const chapterId = utils.getChapterId(sourceUrl);
    const seriesId = utils.getSeriesId(this.constructUrl(seriesSlug));

    return { id: chapterId, slug: chapterSlug, seriesId, url: sourceUrl, pages };
  },
};

export default MangakakalotAdapter;

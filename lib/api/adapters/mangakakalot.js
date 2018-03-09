// @flow

import assert from 'assert';
import cheerio from 'cheerio';
import moment from 'moment-timezone';
import utils from '../utils';

import type { SiteAdapter, ChapterPreview, Page } from '../types';

const TZ = 'Asia/Hong_Kong';

const getUnixTimestamp = (year: number, date: string) => moment.tz(`${year}-${date}`, 'YYYY-MM-DD HH:mm', TZ).unix();

// http://mangakakalot.com/manga/<series-id>
// http://mangakakalot.com/chapter/<series-id>/chapter_<chapter-id>

const MangakakalotAdapter: SiteAdapter = {
  id: utils.getSiteId('Mangakakalot'),
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

  async getSeries(seriesSlug) {
    const html = await utils.getPage(`http://mangakakalot.com/manga/${seriesSlug}`);
    const dom = cheerio.load(html);

    const id = utils.getSeriesId(this.id, seriesSlug);
    const title = dom('h1', 'ul.manga-info-text').first().text().trim();

    const updatedAtRawText = dom('li', 'ul.manga-info-text').eq(3).text().trim();
    const updatedAtText = updatedAtRawText.split('Last updated : ').pop();
    const updatedAtTimestamp = moment.tz(updatedAtText, 'MMM-DD-YYYY HH:mm:ss A', TZ);
    const updatedAt = updatedAtTimestamp.unix();

    const chapterRawData = dom('.row', '.chapter-list').get().map(el => {
      const slug = dom('a', el).attr('href').split('/chapter_').pop();
      const createdAtText = dom('span', el).eq(2).text();

      return { slug, createdAtText };
    });

    // NOTE: since Mangakakalot doesn't give the year with a chapter timestamp,
    // we assume the most recent chapter matches the updatedAt timestamp for the
    // series. Then, we work backwards, assuming each chapter was released
    // before later ones.

    let lastUpdatedYear = updatedAtTimestamp.year();

    const chapters: Array<ChapterPreview> = chapterRawData.map((chapterData, i, arr) => {
      const prev = arr[i - 1];
      const { createdAtText, slug } = chapterData;
      const id = utils.getChapterId(this.id, seriesSlug, slug);

      let createdAt = getUnixTimestamp(lastUpdatedYear, createdAtText);

      if (prev) {
        const prevCreatedAt = getUnixTimestamp(lastUpdatedYear, prev.createdAtText);

        if (prevCreatedAt < createdAt) {
          lastUpdatedYear -= 1;
          createdAt = moment.unix(createdAt)
            .year(lastUpdatedYear)
            .unix();
        }
      }

      return { id, slug, createdAt };
    });

    return { id, slug: seriesSlug, title, chapters, updatedAt };
  },

  async getChapter(seriesSlug, chapterSlug) {
    const sourceUrl = `http://mangakakalot.com/chapter/${seriesSlug}/chapter_${chapterSlug}`;
    const html = await utils.getPage(sourceUrl);
    const dom = cheerio.load(html);

    const pages: Array<Page> = dom('img', '#vungdoc').get().map(el => {
      const url = dom(el).attr('src');
      const id = url.split('/').pop().split('_').shift();

      return { id, url };
    });

    const chapterId = utils.getChapterId(this.id, seriesSlug, chapterSlug);
    const seriesId = utils.getSeriesId(this.id, seriesSlug);

    return { id: chapterId, slug: chapterSlug, seriesId, sourceUrl, pages };
  },
};

export default MangakakalotAdapter;

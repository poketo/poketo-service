// @flow

// http://mangakakalot.com/manga/<series-id>
// http://mangakakalot.com/chapter/<series-id>/chapter_<chapter-id>

import cheerio from 'cheerio';
import moment from 'moment-timezone';
import utils from '../utils';

import type { SiteAdapter, ChapterPreview, Page } from '../types';

const TZ = 'Asia/Hong_Kong';

const getUnixTimestamp = (year: number, date: string) => moment.tz(`${year}-${date}`, 'YYYY-MM-DD HH:mm', TZ).unix();

const MangakakalotAdapter: SiteAdapter = {
  supportsUrl(url) {
    return utils.compareDomain(url, 'http://mangakakalot.com');
  },

  supportsReading() {
    return true;
  },

  async getSeriesMetadata(seriesId) {
    const html = await utils.getPage(`http://mangakakalot.com/manga/${seriesId}`);
    const dom = cheerio.load(html);

    const title = dom('h1', 'ul.manga-info-text').first().text().trim();

    const updatedAtRawText = dom('li', 'ul.manga-info-text').eq(3).text().trim();
    const updatedAtText = updatedAtRawText.split('Last updated : ').pop();
    const updatedAtTimestamp = moment.tz(updatedAtText, 'MMM-DD-YYYY HH:mm:ss A', TZ);
    const updatedAt = updatedAtTimestamp.unix();

    const chapterRawData = dom('.row', '.chapter-list').get().map(el => {
      const id = dom('a', el).attr('href').split('/chapter_').pop();
      const createdAtText = dom('span', el).eq(2).text();

      return { id, createdAtText };
    });

    // NOTE: since Mangakakalot doesn't give the year with a chapter timestamp,
    // we assume the most recent chapter matches the updatedAt timestamp for the
    // series. Then, we work backwards, assuming each chapter was released
    // before later ones.

    let lastUpdatedYear = updatedAtTimestamp.year();

    const chapters: Array<ChapterPreview> = chapterRawData.map((chapterData, i, arr) => {
      const prev = arr[i - 1];
      const { createdAtText, id } = chapterData;

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

      return { id, createdAt };
    });

    return { slug: seriesId, title, chapters, updatedAt };
  },

  async getSeriesChapter(seriesId, chapterId) {
    const sourceUrl = `http://mangakakalot.com/chapter/${seriesId}/chapter_${chapterId}`;
    const html = await utils.getPage(sourceUrl);
    const dom = cheerio.load(html);

    const pages: Array<Page> = dom('img', '#vungdoc').get().map(el => {
      const url = dom(el).attr('src');
      return {
        id: url.split('/').pop().split('_').shift(),
        url,
      };
    });

    return { id: chapterId, seriesId, sourceUrl, pages };
  },
};

export default MangakakalotAdapter;

// @flow

import assert from 'assert';
import moment from 'moment-timezone';
import utils from '../utils';

import type { SiteAdapter, ChapterPreview, Page } from '../types';

const TZ = 'America/Los_Angeles';

// Series URLs
// http://helveticascans.com/r/series/talentless-nana/
// http://helveticascans.com/r/series/moussou-telepathy/
// Reader URLs
// http://helveticascans.com/r/read/talentless-nana/en/2/11/page/1
// http://helveticascans.com/r/read/mousou-telepathy/en/0/499/page/1

const HelveticaScansAdapter: SiteAdapter = {
  id: utils.getSiteId('helvetica-scans'),
  name: 'Helvetica Scans',

  supportsUrl(url) {
    return utils.compareDomain(url, 'http://helveticascans.com/');
  },

  supportsReading () {
    return true;
  },

  parseUrl(url) {
    const matches = utils.pathMatch(
      url,
      '/r/:type(read|series)/:seriesSlug/:chapterSlug([a-z]{2}\/.+)?',
    );

    assert(matches !== null, `Could not parse url`);
    assert(matches.seriesSlug, `Could not parse url`);

    const seriesSlug = matches.seriesSlug;
    const chapterSlug = matches.type === 'read'
      ? matches.chapterSlug.split('/page/').shift()
      : null;

    return { seriesSlug, chapterSlug };
  },

  async getSeries(seriesSlug) {
    const json = await utils.getJSON(`http://helveticascans.com/r/api/reader/comic/stub/${seriesSlug}/format/json`);

    const title = json.comic.name;
    const seriesId = utils.getSeriesId(this.id, seriesSlug);
    const chapters: Array<ChapterPreview> = json.chapters.map(data => {
      const chapterSlug = `${data.chapter.language}/${data.chapter.volume}/${data.chapter.chapter}`;
      const chapterId = utils.getChapterId(this.id, seriesId, chapterSlug);
      const createdAt = moment.tz(data.chapter.created, TZ).unix();

      return { id: chapterId, slug: chapterSlug, createdAt };
    }).sort((a, b) => b.createdAt - a.createdAt);
    const updatedAt = chapters.reduce((a, b) => Math.max(a, b.createdAt), 0);

    return { id: seriesId, slug: seriesSlug, title, chapters, updatedAt };
  },

  async getChapter(seriesSlug, chapterSlug) {
    const sourceUrl = `http://helveticascans.com/r/read/${seriesSlug}/${chapterSlug}/page/1`;
    const html = await utils.getPage(sourceUrl);

    // Helvetica embeds reader pages with a JSON blob of all the images. We can
    // parse this blob to get all the URLs.
    const matches = /var\s+pages\s+=\s+(.+);/.exec(html);
    const imageObject = JSON.parse(matches[1]);

    const pages: Array<Page> = imageObject.map(image => ({
      id: image.id,
      width: Number(image.width),
      height: Number(image.height),
      url: image.url,
    }));

    const id = utils.getChapterId(this.id, seriesSlug, chapterSlug);
    const seriesId = `${this.id}-${seriesSlug}`;

    return { id, slug: chapterSlug, seriesId, sourceUrl, pages };
  }
}

export default HelveticaScansAdapter;

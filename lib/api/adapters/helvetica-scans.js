// @flow

import moment from 'moment-timezone';
import errors from '../errors';
import utils, { invariant } from '../utils';

import type { SiteAdapter, ChapterPreview, Page } from '../types';

const TZ = 'UTC';

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

    invariant(matches, new errors.InvalidUrlError(url));
    invariant(matches.seriesSlug, new errors.InvalidUrlError(url));

    const seriesSlug = matches.seriesSlug;
    const chapterSlug = matches.type === 'read'
      ? matches.chapterSlug.split('/page/').shift()
      : null;

    return { seriesSlug, chapterSlug };
  },

  constructUrl(seriesSlug, chapterSlug) {
    const isChapter = chapterSlug !== null && chapterSlug !== undefined;

    const parts = [
      'http://helveticascans.com/r',
      isChapter ? 'read' : 'series',
      seriesSlug,
    ];

    if (isChapter) {
      parts.push(chapterSlug);
      parts.push('page/1');
    }

    return utils.normalizeUrl(parts.join('/'));
  },

  async getSeries(seriesSlug) {
    const url = this.constructUrl(seriesSlug);
    const id = utils.getSeriesId(url);

    const json = await utils.getJSON(`http://helveticascans.com/r/api/reader/comic/stub/${seriesSlug}/format/json`);
    const title = json.comic.name;

    const chapters: Array<ChapterPreview> = json.chapters.map(data => {
      const subchapter = data.chapter.subchapter === '0'
        ? null
        : data.chapter.subchapter;

      const slug = [
        data.chapter.language,
        data.chapter.volume,
        data.chapter.chapter,
        subchapter,
      ].filter(Boolean).join('/');

      const url = this.constructUrl(seriesSlug, slug);
      const id = utils.getChapterId(url);
      const number = [data.chapter.chapter, subchapter].filter(Boolean).join('.');
      const createdAt = moment.tz(data.chapter.created, TZ).unix();

      return { id, url, slug, number, createdAt };
    }).sort((a, b) => b.createdAt - a.createdAt);

    const updatedAt = chapters.reduce((a, b) => Math.max(a, b.createdAt), 0);

    return { id, slug: seriesSlug, url, title, chapters, updatedAt };
  },

  async getChapter(seriesSlug, chapterSlug) {
    const url = this.constructUrl(seriesSlug, chapterSlug);
    const id = utils.getChapterId(url);
    const seriesId = utils.getSeriesId(this.constructUrl(seriesSlug));

    const html = await utils.getPage(url);
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

    return { id, slug: chapterSlug, url, seriesId, pages };
  }
}

export default HelveticaScansAdapter;

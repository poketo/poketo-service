// @flow

import cheerio from 'cheerio';
import moment from 'moment-timezone';
import errors from '../errors';
import utils, { invariant } from '../utils';
import type { Chapter, ChapterMetadata, SiteAdapter } from '../types';

const normalizeJson = str => str
  .replace(/'/g, '"')
  .replace(/,]$/, ']');

const extractPattern = (pattern: RegExp, html: string): any => {
  const matches = pattern.exec(html);

  if (!matches) {
    throw new Error(`Could not find matches for ${pattern.toString()} in page`);
  }

  try {
    return JSON.parse(normalizeJson(matches[1]));
  } catch (err) {
    throw new Error(`Could not parse JSON from page`);
  }
}

const MangadexAdapter: SiteAdapter = {
  id: 'mangadex',
  name: 'Mangadex',

  supportsUrl(url) {
    return utils.compareDomain(url, 'https://mangadex.org');
  },

  supportsReading () {
    return true;
  },

  parseUrl(url) {
    // https://mangadex.org/manga/13127
    // https://mangadex.org/manga/13127/uramikoi-koi-uramikoi
    // https://mangadex.org/chapter/37149/1

    const matches = utils.pathMatch(
      url,
      '/:type(manga|chapter)/:first/:second?',
    );

    invariant(matches, new errors.InvalidUrlError(url));
    invariant(matches.first, new errors.InvalidUrlError(url));

    const isChapter = matches.type === 'chapter';
    const seriesSlug = isChapter ? null : matches.first;
    const chapterSlug = isChapter ? matches.first : null;

    return { seriesSlug, chapterSlug };
  },

  constructUrl(seriesSlug, chapterSlug) {
    const type = chapterSlug ? 'chapter' : 'manga';
    const slug = type === 'chapter' ? chapterSlug : seriesSlug;

    invariant(slug, new TypeError('Either series or chapter slug must be non-null'));

    return utils.normalizeUrl(`https://mangadex.org/${type}/${slug}`);
  },

  async getSeries(seriesSlug) {
    const url = this.constructUrl(seriesSlug);

    const rss = await utils.getPage(`https://mangadex.org/rss/manga_id/${seriesSlug}`);
    const xml = cheerio.load(rss, { xmlMode: true });

    const rssChapters = xml('item', 'channel');
    const rssTitle = rssChapters.first().text().trim();
    const title = rssTitle.split(' - ').shift();

    const chapters: Array<ChapterMetadata> = rssChapters.get().map(el => {
      const createdAtText = xml(el).find('pubDate').text();
      const titleText = xml(el).find('title').text().trim();
      const languageText = xml(el).find('description').text();
      const slugText = xml(el).find('link').text().trim();

      // Since Poketo has no notion of languages, we'll just return the english
      // versions of a chapter. Sorry, international peeps :(
      if (!languageText.includes('Language: English')) {
        return null;
      }

      const createdAt = moment.tz(createdAtText, 'dddd, D MMM YYYY, HH:mm:ss', 'UTC').unix();
      const numberMatches = /chapter (\d+)$/i.exec(titleText);
      // NOTE: we don't really know how to handle when the chapter number can't
      // be found just yet. Sometimes this will return values like "Oneshot"
      const number = numberMatches ? numberMatches[1] : titleText.split(' - ').pop();
      const slug = slugText.split('/').pop();
      const url = this.constructUrl(seriesSlug, slug);

      return { slug, number, url, createdAt };
    }).filter(Boolean);

    return { slug: seriesSlug, url, title, chapters };
  },

  async getChapter(_, chapterSlug) {
    const url = this.constructUrl(null, chapterSlug);

    const html = await utils.getPage(url);
    // Mangadex embeds pages in script tags.
    const imageServer = extractPattern(/var\s+server\s+=\s+(.+);/, html);
    const hash = extractPattern(/var\s+dataurl\s+=\s+(.+);/, html);
    const pagesJson = extractPattern(/var\s+page_array\s+=\s+([^;]+);/, html);

    const pages = pagesJson.map(path => ({
      url: `${imageServer}${hash}/${path}`
    }));

    // NOTE: we return seriesSlug here since we don't get it from the URL, but
    // we still use it to generate the IDs.
    const seriesSlug = extractPattern(/var\s+manga_id\s+=\s+(.+);/, html);

    return { slug: chapterSlug, url, seriesSlug, pages };
  }
}

export default MangadexAdapter;

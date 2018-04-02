// @flow

import MangaHereAdapter from './adapters/manga-here';
import MangaUpdatesAdapter from './adapters/manga-updates';
import MangadexAdapter from './adapters/mangadex';
import MangakakalotAdapter from './adapters/mangakakalot';
import ManganeloAdapter from './adapters/manganelo';
import MerakiScansAdapter from './adapters/meraki-scans';
import HelveticaScansAdapter from './adapters/helvetica-scans';
import errors from './errors';
import utils, { invariant } from './utils';

import type { Chapter, ChapterMetadata, SiteAdapter, Series } from './types';

const adapters = [
  MangaHereAdapter,
  MangaUpdatesAdapter,
  MangadexAdapter,
  MangakakalotAdapter,
  ManganeloAdapter,
  MerakiScansAdapter,
  HelveticaScansAdapter,
];

function getAdapterByUrl(url: string): SiteAdapter {
  const adapter = adapters.find(adapter => adapter.supportsUrl(url));
  invariant(adapter, new errors.UnsupportedSiteError(url));
  return adapter;
}

function getAdapterBySiteId (siteId: string): SiteAdapter {
  const adapter = adapters.find(adapter => adapter.id === siteId);
  invariant(adapter, new errors.UnsupportedSiteError(siteId));
  return adapter;
}

const poketo: any = {
  /**
   * Returns the URL for a given chapter or series based on the components
   * passed in. This URL is not guaranteed to be live or reachable.
   *
   * Meant for reconstructing URLs from pieces in routes.
   */
  constructUrl(siteId: string, seriesSlug: string, chapterSlug: ?string): string {
    const site = getAdapterBySiteId(siteId);
    return site.constructUrl(seriesSlug, chapterSlug);
  },

  /**
   * Returns a `Series` object with details about a manga series at the given
   * URL. If the URL is not supported, an error will be thrown.
   */
  async getSeries(url: string): Promise<Series> {
    const site = getAdapterByUrl(url);
    const parts = site.parseUrl(url);

    invariant(parts.seriesSlug, new Error('Could not read series slug'));

    const seriesData = await site.getSeries(parts.seriesSlug);

    const series: any = {
      id: utils.generateId(site.id, seriesData.slug),
      slug: seriesData.slug,
      url: seriesData.url,
      title: seriesData.title,
      site: {
        id: site.id,
        name: site.name,
      },
      supportsReading: site.supportsReading(),
      updatedAt: seriesData.updatedAt,
    };

    if (seriesData.chapters) {
      series.chapters = seriesData.chapters
        .map(chapterData => ({ ...chapterData, id: utils.generateId(site.id, seriesData.slug, chapterData.slug )}))
        .sort((a, b) => b.createdAt - a.createdAt);

      if (!seriesData.updatedAt && seriesData.chapters) {
        series.updatedAt = seriesData.chapters.reduce((a, b) => Math.max(a, b.createdAt), 0);
      }
    };

    invariant(series.updatedAt, new Error('Could not set series updatedAt'));

    return series;
  },

  /**
   * Returns a `Chapter` object with details about a single chapter of a manga
   * series from a given URL. If the URL is not supported, an error will be thrown.
   */
  async getChapter(url: string): Promise<Chapter> {
    const site = getAdapterByUrl(url);
    const parts = site.parseUrl(url);

    // NOTE: we only check for chapter slug here since some sites (eg. Mangadex)
    // have chapter-only urls (eg. https://mangadex.org/chapter/123456)
    invariant(parts.chapterSlug, new Error('Could not read chapter slug'));

    const chapterData = await site.getChapter(parts.seriesSlug, parts.chapterSlug);

    return {
      id: utils.generateId(site.id, chapterData.seriesSlug, parts.chapterSlug),
      url: chapterData.url,
      pages: chapterData.pages,
    };
  },
};

Object.assign(poketo, errors);

export default poketo;

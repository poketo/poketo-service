// @flow

import MangaHereAdapter from './adapters/manga-here';
import MangaUpdatesAdapter from './adapters/manga-updates';
import MangakakalotAdapter from './adapters/mangakakalot';
import ManganeloAdapter from './adapters/manganelo';
import MerakiScansAdapter from './adapters/meraki-scans';
import HelveticaScansAdapter from './adapters/helvetica-scans';
import utils from './utils';

import type { SiteAdapter, Series } from './types';

const adapters = [
  MangaHereAdapter,
  MangaUpdatesAdapter,
  MangakakalotAdapter,
  ManganeloAdapter,
  MerakiScansAdapter,
  HelveticaScansAdapter,
];

function getAdapterByUrl(url: string): SiteAdapter {
  const adapter = adapters.find(adapter => adapter.supportsUrl(url));
  if (adapter === undefined) {
    throw new Error(`Unsupported site at '${url}'`);
  }
  return adapter;
}

const poketo = {
  /**
   * Returns the URL for a given chapter or series based on the components
   * passed in. This URL is not guaranteed to be live or reachable.
   *
   * Meant for reconstructing URLs from pieces in routes.
   */
  constructUrl(siteId: string, seriesSlug: string, chapterSlug: ?string): string {
    const site = adapters.find(adapter => adapter.id === siteId);

    if (site === undefined) {
      throw new Error(`Unsupported site '${siteId}'`);
    }

    return site.constructUrl(seriesSlug, chapterSlug);
  },

  /**
   * Returns a `Series` object with details about a manga series at the given
   * URL. If the URL is not supported, an error will be thrown.
   */
  async getSeries(url: string) {
    const site = getAdapterByUrl(url);
    const parts = site.parseUrl(url);
    const series = await site.getSeries(parts.seriesSlug);

    return {
      ...series,
      site: {
        id: site.id,
        name: site.name,
      },
      supportsReading: site.supportsReading(),
    };
  },

  /**
   * Returns a `Chapter` object with details about a single chapter of a manga
   * series from a given URL. If the URL is not supported, an error will be thrown.
   */
  async getChapter(url: string) {
    const site = getAdapterByUrl(url);
    const parts = site.parseUrl(url);

    if (parts.chapterSlug === null) {
      throw new Error('Could not parse url');
    }

    return await site.getChapter(parts.seriesSlug, parts.chapterSlug);
  },
};

export default poketo;

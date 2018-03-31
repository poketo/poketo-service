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

import type { SiteAdapter, Series } from './types';

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
  async getSeries(url: string) {
    const site = getAdapterByUrl(url);
    const parts = site.parseUrl(url);

    if (!parts.seriesSlug) {
      throw new Error('Could not read series slug');
    }

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

    invariant(parts.chapterSlug, new errors.InvalidUrlError(url));

    return await site.getChapter(parts.seriesSlug, parts.chapterSlug);
  },
};

Object.assign(poketo, errors);

export default poketo;

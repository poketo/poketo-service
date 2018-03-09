// @flow

import MangaHereAdapter from './adapters/manga-here';
import MangaUpdatesAdapter from './adapters/manga-updates';
import MangakakalotAdapter from './adapters/mangakakalot';
import MerakiScansAdapter from './adapters/meraki-scans';
import HelveticaScansAdapter from './adapters/helvetica-scans';
import utils from './utils';

const adapters = [
  MangaHereAdapter,
  MangaUpdatesAdapter,
  MangakakalotAdapter,
  MerakiScansAdapter,
  HelveticaScansAdapter,
];

function getSupportedAdapter(url) {
  const supported = adapters.filter(adapter => adapter.supportsUrl(url));
  if (supported.length < 1) {
    throw new Error(`Unsupported site at '${url}'`);
  }
  return supported[0];
}

export default {
  async getSeries(url: string) {
    const site = getSupportedAdapter(url);
    const parts = site.parseUrl(url);
    const series = await site.getSeries(parts.seriesSlug);

    return { ...series, supportsChapters: site.supportsReading() };
  },

  async getChapter(url: string) {
    const site = getSupportedAdapter(url);
    const parts = site.parseUrl(url);

    return await site.getChapter(parts.seriesSlug, parts.chapterSlug);
  },
};

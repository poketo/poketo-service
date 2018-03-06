// @flow

import cheerio from 'cheerio';
import moment from 'moment-timezone';
import utils from '../utils';

import type { SiteAdapter } from '../types';

const MangaUpdatesAdapter: SiteAdapter = {
  id: utils.getSiteId('manga-updates'),
  name: 'MangaUpdates',

  supportsUrl(url) {
    return utils.compareDomain(url, 'http://mangaupdates.com');
  },

  supportsReading () {
    return false;
  },

  async getSeriesMetadata(seriesSlug) {
    const html = await utils.getPage(`https://www.mangaupdates.com/releases.html?search=${seriesSlug}&stype=series`);
    const dom = cheerio.load(html);

    const id = utils.getSeriesId(this.id, seriesSlug);
    // NOTE: we strip a '*' from the end of the title since MangaUpdates uses that
    // to show if series information has updated in the last 24 hours.
    const title = dom('td.text.pad[bgcolor]:nth-child(2)', '#main_content').first().text().replace(/\*$/, '');
    const updatedAtDate = dom('td.text.pad[bgcolor]:nth-child(1)', '#main_content').first().text();
    const updatedAt = moment.tz(updatedAtDate, 'MM/DD/YY', 'America/Los_Angeles').unix();

    return { id, slug: seriesSlug, title, updatedAt };
  },

  async getSeriesChapter() {
    throw new Error('MangaUpdates does not support getting chapter');
  },
};

export default MangaUpdatesAdapter;

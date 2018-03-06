// @flow

import got from 'got';
import cheerio from 'cheerio';
import moment from 'moment-timezone';
import normalize from 'normalize-url';
import probe from 'probe-image-size';
import hash from '@sindresorhus/string-hash';
import { URL } from 'url';

import { toSiteId, toSeriesId, toChapterId } from './types';
import type { PageDimensions, SiteId, SeriesId, ChapterId } from './types';

const getNormalizedDomain = (url: string): string => {
  const u = new URL(normalize(url));
  return u.hostname;
};

const generateId = (...parts: Array<string>) => String(hash(parts.join('-')));

export default {
  compareDomain(a: string, b: string) {
    return getNormalizedDomain(a) === getNormalizedDomain(b);
  },

  flatten(arr: Array<any>) {
    return [].concat(...arr);
  },

  getSiteId(key: string): SiteId {
    return toSiteId(key);
  },

  getSeriesId(siteId: SiteId, seriesSlug: string): SeriesId {
    return toSeriesId(generateId(siteId, seriesSlug));
  },

  getChapterId(siteId: SiteId, seriesSlug: string, chapterSlug: string): ChapterId {
    return toChapterId(generateId(siteId, seriesSlug, chapterSlug));
  },

  async getPage(url: string): Promise<string> {
    const res = await got(url);
    const html = res.body;
    return html;
  },

  async getJSON(url: string): Promise<Object> {
    const res = await got(url, { json: true });
    const json = res.body;
    return json;
  },

  async getImageSize(url: string): Promise<PageDimensions> {
    const { width, height } = await probe(url);
    return { width, height };
  },
};

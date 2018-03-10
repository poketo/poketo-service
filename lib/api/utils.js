// @flow

import got from 'got';
import cheerio from 'cheerio';
import moment from 'moment-timezone';
import normalize from 'normalize-url';
import pathMatch from 'path-match';
import probe from 'probe-image-size';
import hash from '@sindresorhus/string-hash';
import { URL, type URLSearchParams } from 'url';

import { toSiteId, toSeriesId, toChapterId } from './types';
import type { PageDimensions, SiteId, SeriesId, ChapterId } from './types';

const getNormalizedDomain = (url: string): string => {
  const u = new URL(normalize(url));
  return u.hostname;
};

const generateId = (...parts: Array<string>) => String(hash(parts.join('-')));
const match = pathMatch();

export default {
  compareDomain(a: string, b: string) {
    return getNormalizedDomain(a) === getNormalizedDomain(b);
  },

  flatten(arr: Array<any>) {
    return [].concat(...arr);
  },

  pathMatch(url: string, pattern: string): ?Object {
    const u = new URL(normalize(url));
    // NOTE: we normalize urls to always have a trailing slash here. This makes
    // matching with path-match easier, since we can then do patterns like
    // /:seriesSlug/:chapterSlug which works even if there's no chapterSlug
    // segment.
    const pathnameWithTrailingSlash = u.pathname + '/';
    const matches = match(pattern)(pathnameWithTrailingSlash);

    if (matches === false) {
      return null;
    }

    return matches;
  },

  pathname(url: string): string {
    const u = new URL(url);
    return u.pathname;
  },

  searchParams(url: string): URLSearchParams {
    const u = new URL(url);
    return u.searchParams;
  },

  hash(input: string): string {
    return String(hash(input));
  },

  getSiteId(key: string): SiteId {
    return toSiteId(key);
  },

  getSeriesId(url: string): SeriesId {
    return toSeriesId(this.hash(url));
  },

  getChapterId(url: string): ChapterId {
    return toChapterId(this.hash(url));
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

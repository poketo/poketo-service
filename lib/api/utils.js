// @flow

import got from 'got';
import cheerio from 'cheerio';
import moment from 'moment-timezone';
import normalize from 'normalize-url';
import probe from 'probe-image-size';
import { URL } from 'url';

const getNormalizedDomain = (url: string): string => {
  const u = new URL(normalize(url));
  return u.hostname;
};

export default {
  compareDomain(a: string, b: string) {
    return getNormalizedDomain(a) === getNormalizedDomain(b);
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

  async getImageSize(url: string): Promise<{ width: number, height: number }> {
    const { width, height } = await probe(url);
    return { width, height };
  }
};

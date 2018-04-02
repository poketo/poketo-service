import site from './manga-updates';
import errors from '../errors';

describe('MangaUpdatesAdapter', () => {
  describe('supportsUrl', () => {
    it('returns true for urls like mangaupdates.com', () => {
      expect(site.supportsUrl('http://mangaupdates.com'));
      expect(site.supportsUrl('https://www.mangaupdates.com'));
    });

    it('returns false for urls that are not mangaupdates.com', () => {
      expect(site.supportsUrl('http://www.mangahere.com'));
      expect(site.supportsUrl('http://ma.ngahere.co'));
    });
  });

  describe('parseUrl', () => {
    it('returns the components of a url', () => {
      expect(
        site.parseUrl('http://mangaupdates.com/series.html?id=111976'),
      ).toEqual({ seriesSlug: '111976', chapterSlug: null });
    });

    it('throws on unparseable urls', () => {
      expect(() => {
        site.parseUrl('https://www.mangaupdates.com/authors.html?id=462621');
      }).toThrow(errors.InvalidUrlError);
    });
  });

  describe('getSeries', () => {
    it('returns a metadata object', async () => {
      const metadata = await site.getSeries('111976');

      expect(metadata).toEqual({
        slug: '111976',
        url: 'https://mangaupdates.com/series.html?id=111976',
        title: 'Urami Koi, Koi, Urami Koi.',
        updatedAt: expect.any(Number),
      });
    });
  });

  describe('getChapter', () => {
    it('throws an error', async () => {
      await expect(site.getChapter('111976')).rejects.toThrowError(errors.UnsupportedSiteRequest);
    })
  });
});

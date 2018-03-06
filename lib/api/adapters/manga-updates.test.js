import site from './manga-updates';

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

  describe('getSeriesMetadata', () => {
    it('returns a metadata object', async () => {
      const metadata = await site.getSeriesMetadata('111976');

      expect(metadata).toEqual({
        id: '2045512630',
        slug: '111976',
        title: 'Urami Koi, Koi, Urami Koi.',
        updatedAt: 1517817600,
      });
    });
  });

  describe('getSeriesChapter', () => {
    it('throws an error', async () => {
      await expect(site.getSeriesChapter('111976')).rejects.toThrowError('does not support getting chapter');
    })
  });
});

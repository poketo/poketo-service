import site from './meraki-scans';

describe('MerakiScansAdapter', () => {
  describe('supportsUrl', () => {
    it('returns true for urls at merakiscans.com', () => {
      expect(site.supportsUrl('http://merakiscans.com'));
      expect(site.supportsUrl('http://merakiscans.com/a/path'));
      expect(site.supportsUrl('https://www.merakiscans.com/another?path'));
    });

    it('returns false for urls not at merakiscans.com', () => {
      expect(site.supportsUrl('http://merakkiscans.com'));
      expect(site.supportsUrl('http://mangaupdates.com'));
    });
  });

  describe('getSeriesMetadata', () => {
    it('returns a metadata object', async () => {
      const metadata = await site.getSeriesMetadata(
        'ninja-shinobu-san-no-junjou',
      );

      expect(metadata).toEqual({
        slug: 'ninja-shinobu-san-no-junjou',
        title: 'Ninja Shinobu-san no Junjou',
        chapters: expect.any(Array),
        updatedAt: expect.any(Number),
      });
    });
  });

  describe('getSeriesChapter', () => {
    it('returns a chapter', async () => {
      const chapter = await site.getSeriesChapter(
        'ninja-shinobu-san-no-junjou',
        '32',
      );

      expect(chapter.sourceUrl).toEqual('http://merakiscans.com/ninja-shinobu-san-no-junjou/32');
      expect(chapter.pages).toHaveLength(37);
      expect(chapter.pages[0]).toEqual(
        expect.objectContaining({
          url: expect.stringContaining('http'),
        }),
      );
    });
  });
});

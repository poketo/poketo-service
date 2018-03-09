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

  describe('parseUrl', () => {
    it('returns the components of a url', () => {
      expect(
        site.parseUrl('http://merakiscans.com/senryu-girl/'),
      ).toEqual({ seriesSlug: 'senryu-girl', chapterSlug: null });

      expect(
        site.parseUrl('http://merakiscans.com/senryu-girl/23/5/'),
      ).toEqual({ seriesSlug: 'senryu-girl', chapterSlug: '23' });
    });
  });

  describe('getSeries', () => {
    it('returns a metadata object', async () => {
      const metadata = await site.getSeries(
        'ninja-shinobu-san-no-junjou',
      );

      expect(metadata).toEqual({
        id: '520390524',
        slug: 'ninja-shinobu-san-no-junjou',
        title: 'Ninja Shinobu-san no Junjou',
        chapters: expect.arrayContaining([{
          id: '891890646',
          slug: '21',
          createdAt: 1505006721,
        }]),
        updatedAt: expect.any(Number),
      });
    });
  });

  describe('getChapter', () => {
    it('returns a chapter', async () => {
      const chapter = await site.getChapter(
        'ninja-shinobu-san-no-junjou',
        '32',
      );

      expect(chapter.id).toEqual('841410694');
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

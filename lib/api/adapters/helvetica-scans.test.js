import site from './helvetica-scans';

describe('HelveticaScans', () => {
  describe('supportsUrl', () => {
    it('returns true for urls like helveticascans.com', () => {
      expect(site.supportsUrl('http://helveticascans.com'));
      expect(site.supportsUrl('http://helveticascans.com/a/path'));
      expect(site.supportsUrl('https://www.helveticascans.com/another?path'));
    });

    it('returns false for urls that are not helveticascans.com', () => {
      expect(site.supportsUrl('http://he.lveticascans.com'));
      expect(site.supportsUrl('http://mangaupdates.com'));
    });
  });

  describe('getSeriesMetadata', () => {
    it('returns a metadata object', async () => {
      const metadata = await site.getSeriesMetadata('talentless-nana');

      expect(metadata).toEqual({
        id: '983700072',
        slug: 'talentless-nana',
        title: 'Talentless Nana',
        chapters: expect.any(Array),
        updatedAt: expect.any(Number),
      });
    });
  });

  describe('getSeriesChapter', () => {
    it('returns a list of pages', async () => {
      const chapter = await site.getSeriesChapter('talentless-nana', 'en/2/11');

      expect(chapter.id).toEqual('4112319676');
      expect(chapter.sourceUrl).toEqual('http://helveticascans.com/r/read/talentless-nana/en/2/11/page/1');
      expect(chapter.pages).toHaveLength(43);
      expect(chapter.pages[0]).toEqual(
        expect.objectContaining({
          width: expect.any(Number),
          height: expect.any(Number),
          url: expect.stringContaining('http'),
        }),
      );
    });
  });
});

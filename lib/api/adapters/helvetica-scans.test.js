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

  describe('parseUrl', () => {
    it('returns the components of a url', () => {
      expect(
        site.parseUrl('http://helveticascans.com/r/series/talentless-nana/'),
      ).toEqual({ seriesSlug: 'talentless-nana', chapterSlug: null });

      expect(
        site.parseUrl('http://helveticascans.com/r/read/talentless-nana/en/1/2/page/1'),
      ).toEqual({ seriesSlug: 'talentless-nana', chapterSlug: 'en/1/2' });

      expect(
        site.parseUrl('http://helveticascans.com/r/read/mousou-telepathy/en/0/512/5/page/25'),
      ).toEqual({ seriesSlug: 'mousou-telepathy', chapterSlug: 'en/0/512/5'});
    });

    it('throws on unparseable paths', () => {
      expect(() => {
        site.parseUrl('http://helveticascans.com/r/other/mousou-telepathy/en/2/11/page/1');
      }).toThrow('Could not parse url');

      expect(() => {
        site.parseUrl('http://helveticascans.com/r/');
      }).toThrow('Could not parse url');
    });
  });

  describe('getSeries', () => {
    it('returns a metadata object', async () => {
      const metadata = await site.getSeries('talentless-nana');

      expect(metadata).toEqual({
        id: '983700072',
        slug: 'talentless-nana',
        url: 'http://helveticascans.com/r/series/talentless-nana',
        title: 'Talentless Nana',
        chapters: expect.any(Array),
        updatedAt: expect.any(Number),
      });
    });
  });

  describe('getChapter', () => {
    it('returns a list of pages', async () => {
      const chapter = await site.getChapter('talentless-nana', 'en/2/11');

      expect(chapter.id).toEqual('426727482');
      expect(chapter.url).toEqual(
        'http://helveticascans.com/r/read/talentless-nana/en/2/11/page/1',
      );
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

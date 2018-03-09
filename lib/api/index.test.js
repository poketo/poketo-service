import poketo from '.';

describe('poketo', () => {
  describe('getChapter', () => {
    it('returns a chapter', async () => {
      expect.assertions(2);

      await expect(poketo.getChapter('http://merakiscans.com/senryu-girl/2')).resolves.toMatchSnapshot();
      await expect(poketo.getChapter('http://helveticascans.com/r/read/talentless-nana/en/1/2/page/1')).resolves.toMatchSnapshot();
    });

    it('throws for invalid urls', async () => {
      expect.assertions(2);

      await expect(poketo.getChapter('banana')).rejects.toThrow(/unsupported site/i);
      await expect(poketo.getChapter('http://google.com')).rejects.toThrow(/unsupported site/i);
    });
  });
});

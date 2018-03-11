// @flow

import { URL } from 'url';

export default {
  isUrl: (input: string) => {
    try {
      new URL(input);
    } catch (err) {
      return false;
    }

    return true;
  },

  /**
   * Returns a new Array with the given index replaced with the new item.
   */
  replaceItemAtIndex: (
    arr: Array<any>,
    index: number,
    item: any,
  ): Array<any> => [...arr.slice(0, index), item, ...arr.slice(index + 1)],

  /**
   * Returns a new Array with the given index removed.
   */
  deleteItemAtIndex: (arr: Array<any>, index: number): Array<any> => [
    ...arr.slice(0, index),
    ...arr.slice(index + 1),
  ],
};

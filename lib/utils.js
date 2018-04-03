// @flow

import { URL } from 'url';
import normalizeUrl from 'normalize-url';

export default {
  isNil: (input: any) => {
    return input === null || input === undefined;
  },

  isUrl: (input: string) => {
    try {
      new URL(input);
    } catch (err) {
      return false;
    }

    return true;
  },

  /**
   * Compares two urls by normalizing them first. Fixes inconsistencies like
   * trailing slashes or www. domains.
   */
  compareUrl: (a: string, b: string) => {
    return normalizeUrl(a) === normalizeUrl(b);
  },

  /**
   * Returns an Object keyed by the given function.
   */
  keyArrayBy: (arr: Object[], getKey: (obj: Object) => string) =>
    arr.reduce((a, b) => ({ ...a, [getKey(b)]: b }), {}),

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

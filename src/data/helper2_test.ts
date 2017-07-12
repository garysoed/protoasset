import { assert, TestBase } from '../test-base';
TestBase.setup();

import { ImmutableList } from 'external/gs_tools/src/immutable';

import { Helper2 } from '../data/helper2';

describe('data.Helper2', () => {
  describe('asFunction', () => {
    it('should return the correct function', () => {
      const helper = new Helper2('id', 'name', ImmutableList.of(['a']), 'return a * 2');
      const fn = helper.asFunction();
      assert(fn(1)).to.equal(2);
    });
  });
});

import {assert, TestBase} from '../test-base';
TestBase.setup();

import {Helper} from './helper';


describe('data.Helper', () => {
  let helper: Helper;

  beforeEach(() => {
    helper = new Helper('id', 'name');
  });

  describe('asFunction', () => {
    it('should return the correct function', () => {
      helper.setBody('return a * 2');
      helper.setArgs(['a']);
      let fn = helper.asFunction();
      assert(fn(1)).to.equal(2);
    });
  });
});

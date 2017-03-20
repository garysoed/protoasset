import { assert, Matchers, TestBase } from '../test-base';
TestBase.setup();

import { BuiltInHelpers } from './built-in-helpers';


describe('data.BuiltInHelpers', () => {
  describe('case', () => {
    it('should return the string with the correct case', () => {
      const mockOptions = jasmine.createSpyObj('Options', ['fn']);
      mockOptions.fn.and.returnValue('Original String');
      assert(BuiltInHelpers.case('lower', mockOptions)).to.equal('original-string');
      assert(mockOptions.fn).to.haveBeenCalledWith(Matchers.anyThing());
    });

    it('should throw error if the string case is invalid', () => {
      const mockOptions = jasmine.createSpyObj('Options', ['fn']);
      mockOptions.fn.and.returnValue('Original String');
      assert(() => {
        BuiltInHelpers.case('unsupported', mockOptions);
      }).to.throwError(/Unsupported string case/);
    });
  });

  describe('ifeq', () => {
    it('should return the main block if the two values are equal', () => {
      const content = 'content';
      const mockOptions = jasmine.createSpyObj('Options', ['fn']);
      mockOptions.fn.and.returnValue(content);
      assert(BuiltInHelpers.ifeq('value', 'value', mockOptions)).to.equal(content);
      assert(mockOptions.fn).to.haveBeenCalledWith(Matchers.anyThing());
    });

    it('should return the inverse block if the two values are not equal', () => {
      const content = 'content';
      const mockOptions = jasmine.createSpyObj('Options', ['inverse']);
      mockOptions.inverse.and.returnValue(content);
      assert(BuiltInHelpers.ifeq('value', 'other', mockOptions)).to.equal(content);
      assert(mockOptions.inverse).to.haveBeenCalledWith(Matchers.anyThing());
    });
  });
});

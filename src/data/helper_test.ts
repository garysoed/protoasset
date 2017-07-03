import { assert, Matchers, TestBase } from '../test-base';
TestBase.setup();

import { TestDispose } from 'external/gs_tools/src/testing';

import { DataEvents } from './data-events';
import { Helper } from './helper';


describe('data.Helper', () => {
  let helper: Helper;

  beforeEach(() => {
    helper = new Helper('id', 'name');
    TestDispose.add(helper);
  });

  describe('asFunction', () => {
    it('should return the correct function', () => {
      helper.setBody('return a * 2');
      helper.setArgs(['a']);
      const fn = helper.asFunction();
      assert(fn(1)).to.equal(2);
    });
  });

  describe('setArgs', () => {
    it('should dispatch the changed event', () => {
      spyOn(helper, 'dispatch').and.callFake((_: any, callback: Function) => {
        callback();
      });

      const args = ['arg1', 'arg2'];

      helper.setArgs(args);

      assert(helper.dispatch).to
          .haveBeenCalledWith(DataEvents.CHANGED, Matchers.any(Function) as () => void);
      assert(helper.getArgs()).to.equal(args);
    });

    it('should not dispatch the changed event if the args does not change', () => {
      spyOn(helper, 'dispatch').and.callFake((_: any, callback: Function) => {
        callback();
      });

      const newArgs = ['arg1', 'arg2'];
      helper['args_'] = newArgs;

      helper.setArgs(newArgs);

      assert(helper.dispatch).toNot.haveBeenCalled();
      assert(helper.getArgs()).to.equal(newArgs);
    });
  });

  describe('setBody', () => {
    it('should dispatch the changed event if the body are different', () => {
      spyOn(helper, 'dispatch').and.callFake((_: any, callback: Function) => {
        callback();
      });

      const oldBody = 'oldBody';
      const newBody = 'newBody';
      helper['body_'] = oldBody;

      helper.setBody(newBody);

      assert(helper.dispatch).to
          .haveBeenCalledWith(DataEvents.CHANGED, Matchers.any(Function) as () => void);
      assert(helper.getBody()).to.equal(newBody);
    });

    it('should not dispatch the changed event if the body does not change', () => {
      spyOn(helper, 'dispatch').and.callFake((_: any, callback: Function) => {
        callback();
      });

      const newBody = 'newBody';
      helper['body_'] = newBody;

      helper.setBody(newBody);

      assert(helper.dispatch).toNot.haveBeenCalled();
      assert(helper.getBody()).to.equal(newBody);
    });
  });

  describe('seteName', () => {
    it('should dispatch the changed event if the name are different', () => {
      spyOn(helper, 'dispatch').and.callFake((_: any, callback: Function) => {
        callback();
      });

      const oldName = 'oldName';
      const newName = 'newName';
      helper['name_'] = oldName;

      helper.setName(newName);

      assert(helper.dispatch).to
          .haveBeenCalledWith(DataEvents.CHANGED, Matchers.any(Function) as () => void);
      assert(helper.getName()).to.equal(newName);
    });

    it('should not dispatch the changed event if the name does not change', () => {
      spyOn(helper, 'dispatch').and.callFake((_: any, callback: Function) => {
        callback();
      });

      const newName = 'newName';
      helper['name_'] = newName;

      helper.setName(newName);

      assert(helper.dispatch).toNot.haveBeenCalled();
      assert(helper.getName()).to.equal(newName);
    });
  });
});

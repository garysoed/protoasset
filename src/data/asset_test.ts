import {assert, Matchers, TestBase} from '../test-base';
TestBase.setup();

import {Mocks} from 'external/gs_tools/src/mock';
import {TestDispose} from 'external/gs_tools/src/testing';

import {Asset, AssetType} from './asset';
import {DataEvents} from './data-events';


describe('data.Asset', () => {
  let asset: Asset;

  beforeEach(() => {
    asset = new Asset('id', 'projectId');
    TestDispose.add(asset);
  });

  describe('deleteHelper', () => {
    it('should delete the helper and dispatch the changed event', () => {
      let helperId = 'helperId';
      let helper = Mocks.object('helper');
      asset['helpers_'] = {[helperId]: helper};
      spyOn(asset, 'dispatch').and.callFake((event: any, callback: Function) => {
        callback();
      });

      asset.deleteHelper(helperId);

      assert(asset.dispatch).to
          .haveBeenCalledWith(DataEvents.CHANGED, <() => void> Matchers.any(Function));
      assert(asset.getAllHelpers()).to.equal([]);
    });

    it('should not dispatch the changed event if the helper does not exist', () => {
      spyOn(asset, 'dispatch').and.callFake((event: any, callback: Function) => {
        callback();
      });

      asset.deleteHelper('helperId');

      assert(asset.dispatch).toNot.haveBeenCalled();
      assert(asset.getAllHelpers()).to.equal([]);
    });
  });

  describe('getAllHelpers', () => {
    it('should return the correct helpers', () => {
      let helperId1 = 'helperId1';
      let helperId2 = 'helperId2';
      let helperId3 = 'helperId3';
      let helper1 = Mocks.object('helper1');
      let helper2 = Mocks.object('helper2');
      let helper3 = Mocks.object('helper3');
      asset['helpers_'] = {
        [helperId1]: helper1,
        [helperId2]: helper2,
        [helperId3]: helper3,
      };
      assert(asset.getAllHelpers()).to.equal([helper1, helper2, helper3]);
    });
  });

  describe('getHelper', () => {
    it('should return the correct helper', () => {
      let helperId = 'helperId';
      let helper = Mocks.object('helper');
      asset['helpers_'] = {
        [helperId]: helper,
      };
      assert(asset.getHelper(helperId)).to.equal(helper);
    });

    it('should return null if the helper does not exist', () => {
      let helperId = 'helperId';
      let helper = Mocks.object('helper');
      asset['helpers_'] = {
        [helperId]: helper,
      };
      assert(asset.getHelper('otherHelperId')).to.beNull();
    });
  });

  describe('setData', () => {
    it('should dispatch the CHANGED event', () => {
      spyOn(asset, 'dispatch').and.callFake((event: any, callback: Function) => {
        callback();
      });

      let data = Mocks.object('data');

      asset.setData(data);

      assert(asset.dispatch).to
          .haveBeenCalledWith(DataEvents.CHANGED, <() => void> Matchers.any(Function));
      assert(asset.getData()).to.equal(data);
    });
  });

  describe('setHeight', () => {
    it('should dispatch the CHANGED event', () => {
      spyOn(asset, 'dispatch').and.callFake((event: any, callback: Function) => {
        callback();
      });

      let height = 123;

      asset.setHeight(height);

      assert(asset.dispatch).to
          .haveBeenCalledWith(DataEvents.CHANGED, <() => void> Matchers.any(Function));
      assert(asset.getHeight()).to.equal(height);
    });

    it('should not dispatch the CHANGED event if the height does not change', () => {
      spyOn(asset, 'dispatch').and.callFake((event: any, callback: Function) => {
        callback();
      });

      let height = 123;
      asset['height_'] = height;

      asset.setHeight(height);

      assert(asset.dispatch).toNot.haveBeenCalled();
      assert(asset.getHeight()).to.equal(height);
    });
  });

  describe('setHelper', () => {
    it('should dispatch the CHANGED event', () => {
      spyOn(asset, 'dispatch').and.callFake((event: any, callback: Function) => {
        callback();
      });

      let helperId = 'helperId';
      let helper = Mocks.object('helper');

      asset.setHelper(helperId, helper);

      assert(asset.dispatch).to
          .haveBeenCalledWith(DataEvents.CHANGED, <() => void> Matchers.any(Function));
      assert(asset.getHelper(helperId)).to.equal(helper);
    });

    it('should not dispatch the CHANGED event if the helper does not change', () => {
      spyOn(asset, 'dispatch').and.callFake((event: any, callback: Function) => {
        callback();
      });

      let helperId = 'helperId';
      let helper = Mocks.object('helper');
      asset['helpers_'] = {[helperId]: helper};

      asset.setHelper(helperId, helper);

      assert(asset.dispatch).toNot.haveBeenCalled();
      assert(asset.getHelper(helperId)).to.equal(helper);
    });
  });

  describe('setName', () => {
    it('should dispatch the CHANGED event', () => {
      spyOn(asset, 'dispatch').and.callFake((event: any, callback: Function) => {
        callback();
      });

      let name = 'name';

      asset.setName(name);

      assert(asset.dispatch).to
          .haveBeenCalledWith(DataEvents.CHANGED, <() => void> Matchers.any(Function));
      assert(asset.getName()).to.equal(name);
    });

    it('should not dispatch the CHANGED event if the name does not change', () => {
      spyOn(asset, 'dispatch').and.callFake((event: any, callback: Function) => {
        callback();
      });

      let name = 'name';
      asset['name_'] = name;
      asset.setName(name);

      assert(asset.dispatch).toNot.haveBeenCalled();
      assert(asset.getName()).to.equal(name);
    });
  });

  describe('setType', () => {
    it('should dispatch the CHANGED event', () => {
      spyOn(asset, 'dispatch').and.callFake((event: any, callback: Function) => {
        callback();
      });

      let type = AssetType.CARD;

      asset.setType(type);

      assert(asset.dispatch).to
          .haveBeenCalledWith(DataEvents.CHANGED, <() => void> Matchers.any(Function));
      assert(asset.getType()).to.equal(type);
    });

    it('should not dispatch the CHANGED event if the type does not change', () => {
      spyOn(asset, 'dispatch').and.callFake((event: any, callback: Function) => {
        callback();
      });

      let type = AssetType.CARD;
      asset['type_'] = type;
      asset.setType(type);

      assert(asset.dispatch).toNot.haveBeenCalled();
      assert(asset.getType()).to.equal(type);
    });
  });

  describe('setWidth', () => {
    it('should dispatch the CHANGED event', () => {
      spyOn(asset, 'dispatch').and.callFake((event: any, callback: Function) => {
        callback();
      });

      let width = 123;

      asset.setWidth(width);

      assert(asset.dispatch).to
          .haveBeenCalledWith(DataEvents.CHANGED, <() => void> Matchers.any(Function));
      assert(asset.getWidth()).to.equal(width);
    });

    it('should not dispatch the CHANGED event if the width does not change', () => {
      spyOn(asset, 'dispatch').and.callFake((event: any, callback: Function) => {
        callback();
      });

      let width = 123;
      asset['width_'] = width;
      asset.setWidth(width);

      assert(asset.dispatch).toNot.haveBeenCalled();
      assert(asset.getWidth()).to.equal(width);
    });
  });
});


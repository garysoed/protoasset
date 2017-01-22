import {assert, Matchers, TestBase} from '../test-base';
TestBase.setup();

import {Mocks} from 'external/gs_tools/src/mock';
import {TestDispose} from 'external/gs_tools/src/testing';

import {DataEvents} from '../data/data-events';

import {HelperItem} from './helper-item';


describe('asset.HelperItem', () => {
  let mockAssetCollection;
  let mockRouteFactoryService;
  let mockRouteService;
  let item: HelperItem;

  beforeEach(() => {
    mockAssetCollection = jasmine.createSpyObj('AssetCollection', ['get', 'update']);
    mockRouteFactoryService = jasmine.createSpyObj('RouteFactoryService', ['helper']);
    mockRouteService = jasmine.createSpyObj('RouteService', ['goTo']);
    item = new HelperItem(
        mockAssetCollection,
        mockRouteFactoryService,
        mockRouteService,
        Mocks.object('ThemeService'));
    TestDispose.add(item);
  });

  describe('getAsset_', () => {
    it('should resolve with the correct asset', (done: any) => {
      let projectId = 'projectId';
      let assetId = 'assetId';
      spyOn(item['assetIdBridge_'], 'get').and.returnValue(assetId);
      spyOn(item['projectIdBridge_'], 'get').and.returnValue(projectId);

      let asset = Mocks.object('asset');
      mockAssetCollection.get.and.returnValue(Promise.resolve(asset));

      item['getAsset_']()
          .then((actualAsset: any) => {
            assert(actualAsset).to.equal(asset);
            assert(mockAssetCollection.get).to.haveBeenCalledWith(projectId, assetId);
            done();
          }, done.fail);
    });

    it('should resolve with null if there are no asset IDs', (done: any) => {
      let projectId = 'projectId';
      spyOn(item['assetIdBridge_'], 'get').and.returnValue(null);
      spyOn(item['projectIdBridge_'], 'get').and.returnValue(projectId);

      item['getAsset_']()
          .then((actualAsset: any) => {
            assert(actualAsset).to.beNull();
            done();
          }, done.fail);
    });

    it('should resolve with null if there are no project IDs', (done: any) => {
      let assetId = 'assetId';
      spyOn(item['assetIdBridge_'], 'get').and.returnValue(assetId);
      spyOn(item['projectIdBridge_'], 'get').and.returnValue(null);

      item['getAsset_']()
          .then((actualAsset: any) => {
            assert(actualAsset).to.beNull();
            done();
          }, done.fail);
    });
  });

  describe('getHelper_', () => {
    it('should resolve with the correct helper', (done: any) => {
      let helperId = 'helperId';
      spyOn(item['helperIdBridge_'], 'get').and.returnValue(helperId);

      let helper = Mocks.object('helper');
      let mockAsset = jasmine.createSpyObj('Asset', ['getHelper']);
      mockAsset.getHelper.and.returnValue(helper);
      spyOn(item, 'getAsset_').and.returnValue(Promise.resolve(mockAsset));

      item['getHelper_']()
          .then((actualHelper: any) => {
            assert(actualHelper).to.equal(helper);
            assert(mockAsset.getHelper).to.haveBeenCalledWith(helperId);
            done();
          }, done.fail);
    });

    it('should resolve with null if asset cannot be found', (done: any) => {
      let helperId = 'helperId';
      spyOn(item['helperIdBridge_'], 'get').and.returnValue(helperId);

      spyOn(item, 'getAsset_').and.returnValue(Promise.resolve(null));

      item['getHelper_']()
          .then((actualHelper: any) => {
            assert(actualHelper).to.beNull();
            done();
          }, done.fail);
    });

    it('should resolve with null if there are no helper IDs', (done: any) => {
      spyOn(item['helperIdBridge_'], 'get').and.returnValue(null);

      item['getHelper_']()
          .then((actualHelper: any) => {
            assert(actualHelper).to.beNull();
            done();
          }, done.fail);
    });
  });

  describe('onHelperUpdated_', () => {
    it('should set the name bridge correctly', () => {
      let name = 'name';
      let mockHelper = jasmine.createSpyObj('Helper', ['getName']);
      mockHelper.getName.and.returnValue(name);
      spyOn(item['nameBridge_'], 'set');

      item['onHelperUpdated_'](mockHelper);

      assert(item['nameBridge_'].set).to.haveBeenCalledWith(name);
    });
  });

  describe('onCancelClick_', () => {
    it('should set the root value to read', () => {
      spyOn(item['rootValueBridge_'], 'set');
      item['onCancelClick_']();
      assert(item['rootValueBridge_'].set).to.haveBeenCalledWith('read');
    });
  });

  describe('onDeleteClick_', () => {
    it('should delete the helper and update the asset and helper', (done: any) => {
      let mockAsset = jasmine.createSpyObj('Asset', ['deleteHelper']);
      spyOn(item, 'getAsset_').and.returnValue(Promise.resolve(mockAsset));

      let helperId = 'helperId';
      let mockHelper = jasmine.createSpyObj('Helper', ['getId']);
      mockHelper.getId.and.returnValue(helperId);
      spyOn(item, 'getHelper_').and.returnValue(Promise.resolve(mockHelper));

      spyOn(item, 'updateHelper_');

      mockAssetCollection.update.and.returnValue(Promise.resolve());

      item['onDeleteClick_']()
          .then(() => {
            assert(item['updateHelper_']).to.haveBeenCalledWith();
            assert(mockAssetCollection.update).to.haveBeenCalledWith(mockAsset);
            assert(mockAsset.deleteHelper).to.haveBeenCalledWith(helperId);
            done();
          }, done.fail);
    });

    it('should do nothing if the asset cannot be found', (done: any) => {
      spyOn(item, 'getAsset_').and.returnValue(Promise.resolve(null));

      let helperId = 'helperId';
      let mockHelper = jasmine.createSpyObj('Helper', ['getId']);
      mockHelper.getId.and.returnValue(helperId);
      spyOn(item, 'getHelper_').and.returnValue(Promise.resolve(mockHelper));

      spyOn(item, 'updateHelper_');

      mockAssetCollection.update.and.returnValue(Promise.resolve());

      item['onDeleteClick_']()
          .then(() => {
            assert(item['updateHelper_']).toNot.haveBeenCalled();
            done();
          }, done.fail);
    });

    it('should do nothing if the helper cannot be found', (done: any) => {
      let mockAsset = jasmine.createSpyObj('Asset', ['deleteHelper']);
      spyOn(item, 'getAsset_').and.returnValue(Promise.resolve(mockAsset));
      spyOn(item, 'getHelper_').and.returnValue(Promise.resolve(null));

      spyOn(item, 'updateHelper_');

      mockAssetCollection.update.and.returnValue(Promise.resolve());

      item['onDeleteClick_']()
          .then(() => {
            assert(item['updateHelper_']).toNot.haveBeenCalled();
            done();
          }, done.fail);
    });
  });

  describe('onEditClick_', () => {
    it('should update the input name and set the root value to edit', (done: any) => {
      let name = 'name';
      let mockHelper = jasmine.createSpyObj('Helper', ['getName']);
      mockHelper.getName.and.returnValue(name);
      spyOn(item, 'getHelper_').and.returnValue(Promise.resolve(mockHelper));
      spyOn(item['rootValueBridge_'], 'set');
      spyOn(item['nameInputBridge_'], 'set');

      item['onEditClick_']()
          .then(() => {
            assert(item['rootValueBridge_'].set).to.haveBeenCalledWith('edit');
            assert(item['nameInputBridge_'].set).to.haveBeenCalledWith(name);
            done();
          }, done.fail);
    });

    it('should delete the input name if the helper does not exist', (done: any) => {
      spyOn(item, 'getHelper_').and.returnValue(Promise.resolve(null));
      spyOn(item['rootValueBridge_'], 'set');
      spyOn(item['nameInputBridge_'], 'delete');

      item['onEditClick_']()
          .then(() => {
            assert(item['rootValueBridge_'].set).to.haveBeenCalledWith('edit');
            assert(item['nameInputBridge_'].delete).to.haveBeenCalledWith();
            done();
          }, done.fail);
    });
  });

  describe('onNameClick_', () => {
    it('should navigate to the correct helper', (done: any) => {
      let assetId = 'assetId';
      let projectId = 'projectId';
      let mockAsset = jasmine.createSpyObj('Asset', ['getId', 'getProjectId']);
      mockAsset.getId.and.returnValue(assetId);
      mockAsset.getProjectId.and.returnValue(projectId);
      spyOn(item, 'getAsset_').and.returnValue(Promise.resolve(mockAsset));

      let helperId = 'helperId';
      let mockHelper = jasmine.createSpyObj('Helper', ['getId']);
      mockHelper.getId.and.returnValue(helperId);
      spyOn(item, 'getHelper_').and.returnValue(Promise.resolve(mockHelper));

      let helperRouteFactory = Mocks.object('helperRouteFactory');
      mockRouteFactoryService.helper.and.returnValue(helperRouteFactory);

      item['onNameClick_']()
          .then(() => {
            assert(mockRouteService.goTo).to.haveBeenCalledWith(
                helperRouteFactory,
                {assetId, helperId, projectId});
            done();
          }, done.fail);
    });

    it('should do nothing if the asset does not exist', (done: any) => {
      spyOn(item, 'getAsset_').and.returnValue(Promise.resolve(null));

      let mockHelper = jasmine.createSpyObj('Helper', ['getId']);
      mockHelper.getId.and.returnValue('helperId');
      spyOn(item, 'getHelper_').and.returnValue(Promise.resolve(mockHelper));

      item['onNameClick_']()
          .then(() => {
            assert(mockRouteService.goTo).toNot.haveBeenCalled();
            done();
          }, done.fail);
    });

    it('should do nothing if the helper cannot be found', (done: any) => {
      let mockAsset = jasmine.createSpyObj('Asset', ['getId', 'getProjectId']);
      mockAsset.getId.and.returnValue('assetId');
      mockAsset.getProjectId.and.returnValue('projectId');
      spyOn(item, 'getAsset_').and.returnValue(Promise.resolve(mockAsset));

      spyOn(item, 'getHelper_').and.returnValue(Promise.resolve(null));

      item['onNameClick_']()
          .then(() => {
            assert(mockRouteService.goTo).toNot.haveBeenCalled();
            done();
          }, done.fail);
    });
  });

  describe('onOkClick_', () => {
    it('should update the helper, save the asset, and set the root value to read', (done: any) => {
      let helperId = 'helperId';
      spyOn(item['helperIdBridge_'], 'get').and.returnValue(helperId);

      let mockHelper = jasmine.createSpyObj('Helper', ['setName']);
      let mockAsset = jasmine.createSpyObj('Asset', ['getHelper']);
      mockAsset.getHelper.and.returnValue(mockHelper);
      spyOn(item, 'getAsset_').and.returnValue(Promise.resolve(mockAsset));

      let name = 'name';
      spyOn(item['nameInputBridge_'], 'get').and.returnValue(name);
      spyOn(item['rootValueBridge_'], 'set');

      item['onOkClick_']()
          .then(() => {
            assert(mockAssetCollection.update).to.haveBeenCalledWith(mockAsset);
            assert(item['rootValueBridge_'].set).to.haveBeenCalledWith('read');
            assert(mockHelper.setName).to.haveBeenCalledWith(name);
            assert(mockAsset.getHelper).to.haveBeenCalledWith(helperId);
            done();
          }, done.fail);
    });

    it('should set the name to "" if null', (done: any) => {
      let helperId = 'helperId';
      spyOn(item['helperIdBridge_'], 'get').and.returnValue(helperId);

      let mockHelper = jasmine.createSpyObj('Helper', ['setName']);
      let mockAsset = jasmine.createSpyObj('Asset', ['getHelper']);
      mockAsset.getHelper.and.returnValue(mockHelper);
      spyOn(item, 'getAsset_').and.returnValue(Promise.resolve(mockAsset));

      spyOn(item['nameInputBridge_'], 'get').and.returnValue(null);
      spyOn(item['rootValueBridge_'], 'set');

      item['onOkClick_']()
          .then(() => {
            assert(mockHelper.setName).to.haveBeenCalledWith('');
            done();
          }, done.fail);
    });

    it('should do nothing if the helper does not exist', (done: any) => {
      let helperId = 'helperId';
      spyOn(item['helperIdBridge_'], 'get').and.returnValue(helperId);

      let mockAsset = jasmine.createSpyObj('Asset', ['getHelper']);
      mockAsset.getHelper.and.returnValue(null);
      spyOn(item, 'getAsset_').and.returnValue(Promise.resolve(mockAsset));

      let name = 'name';
      spyOn(item['nameInputBridge_'], 'get').and.returnValue(name);
      spyOn(item['rootValueBridge_'], 'set');

      item['onOkClick_']()
          .then(() => {
            assert(mockAssetCollection.update).toNot.haveBeenCalled();
            assert(item['rootValueBridge_'].set).toNot.haveBeenCalled();
            assert(mockAsset.getHelper).to.haveBeenCalledWith(helperId);
            done();
          }, done.fail);
    });

    it('should do nothing if the asset does not exist', (done: any) => {
      let helperId = 'helperId';
      spyOn(item['helperIdBridge_'], 'get').and.returnValue(helperId);

      spyOn(item, 'getAsset_').and.returnValue(Promise.resolve(null));

      let name = 'name';
      spyOn(item['nameInputBridge_'], 'get').and.returnValue(name);
      spyOn(item['rootValueBridge_'], 'set');

      item['onOkClick_']()
          .then(() => {
            assert(mockAssetCollection.update).toNot.haveBeenCalled();
            assert(item['rootValueBridge_'].set).toNot.haveBeenCalled();
            done();
          }, done.fail);
    });

    it('should do nothing if the helper ID does not exist', (done: any) => {
      spyOn(item['helperIdBridge_'], 'get').and.returnValue(null);

      spyOn(item['rootValueBridge_'], 'set');

      item['onOkClick_']()
          .then(() => {
            assert(mockAssetCollection.update).toNot.haveBeenCalled();
            assert(item['rootValueBridge_'].set).toNot.haveBeenCalled();
            done();
          }, done.fail);
    });
  });

  describe('updateHelper_', () => {
    it('should dispose the previous helper deregister, listen to the CHANGED event, and call ' +
        'helperUpdated_',
        (done: any) => {
          let mockPreviousDeregister = jasmine.createSpyObj('PreviousDeregister', ['dispose']);
          item['helperUpdateDeregister_'] = mockPreviousDeregister;

          let mockDeregister = jasmine.createSpyObj('Deregister', ['dispose']);
          let mockHelper = jasmine.createSpyObj('Helper', ['on']);
          mockHelper.on.and.returnValue(mockDeregister);
          spyOn(item, 'getHelper_').and.returnValue(Promise.resolve(mockHelper));

          let onHelperUpdatedSpy = spyOn(item, 'onHelperUpdated_');

          item['updateHelper_']()
              .then(() => {
                assert(item['onHelperUpdated_']).to.haveBeenCalledWith(mockHelper);

                assert(mockHelper.on).to
                    .haveBeenCalledWith(DataEvents.CHANGED, Matchers.any(Function), item);
                onHelperUpdatedSpy.calls.reset();
                mockHelper.on.calls.argsFor(0)[1]();
                assert(item['onHelperUpdated_']).to.haveBeenCalledWith(mockHelper);
                assert(item['helperUpdateDeregister_']).to.equal(mockDeregister);

                assert(mockPreviousDeregister.dispose).to.haveBeenCalledWith();
                done();
              }, done.fail);
        });

    it('should still dispose the previous helper deregister when the new helper is null',
        (done: any) => {
          let mockPreviousDeregister = jasmine.createSpyObj('PreviousDeregister', ['dispose']);
          item['helperUpdateDeregister_'] = mockPreviousDeregister;

          spyOn(item, 'getHelper_').and.returnValue(Promise.resolve(null));
          spyOn(item, 'onHelperUpdated_');

          item['updateHelper_']()
              .then(() => {
                assert(item['onHelperUpdated_']).toNot.haveBeenCalled();
                assert(mockPreviousDeregister.dispose).to.haveBeenCalledWith();
                done();
              }, done.fail);
        });

    it('should not throw error if there are no previous helper deregisters', (done: any) => {
      let mockHelper = jasmine.createSpyObj('Helper', ['on']);
      mockHelper.on.and.returnValue(jasmine.createSpyObj('Deregister', ['dispose']));
      spyOn(item, 'getHelper_').and.returnValue(Promise.resolve(mockHelper));

      spyOn(item, 'onHelperUpdated_');

      item['updateHelper_']()
          .then(() => {
            assert(item['onHelperUpdated_']).to.haveBeenCalledWith(mockHelper);
            done();
          }, done.fail);
    });
  });

  describe('disposeInternal', () => {
    it('should dispose the deregister function', () => {
      let mockDeregister = jasmine.createSpyObj('Deregister', ['dispose']);
      item['helperUpdateDeregister_'] = mockDeregister;
      item.disposeInternal();
      assert(mockDeregister.dispose).to.haveBeenCalledWith();
    });

    it('should not throw error if there are no deregister functions', () => {
      assert(() => {
        item.disposeInternal();
      }).toNot.throw();
    });
  });
});

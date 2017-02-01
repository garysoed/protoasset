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
        jasmine.createSpyObj('ThemeService', ['applyTheme']));
    TestDispose.add(item);
  });

  describe('getAsset_', () => {
    it('should resolve with the correct asset', async (done: any) => {
      let projectId = 'projectId';
      let assetId = 'assetId';
      spyOn(item['assetIdBridge_'], 'get').and.returnValue(assetId);
      spyOn(item['projectIdBridge_'], 'get').and.returnValue(projectId);

      let asset = Mocks.object('asset');
      mockAssetCollection.get.and.returnValue(Promise.resolve(asset));

      let actualAsset = await item['getAsset_']();
      assert(actualAsset).to.equal(asset);
      assert(mockAssetCollection.get).to.haveBeenCalledWith(projectId, assetId);
    });

    it('should resolve with null if there are no asset IDs', async (done: any) => {
      let projectId = 'projectId';
      spyOn(item['assetIdBridge_'], 'get').and.returnValue(null);
      spyOn(item['projectIdBridge_'], 'get').and.returnValue(projectId);

      let actualAsset = await item['getAsset_']();
      assert(actualAsset).to.beNull();
    });

    it('should resolve with null if there are no project IDs', async (done: any) => {
      let assetId = 'assetId';
      spyOn(item['assetIdBridge_'], 'get').and.returnValue(assetId);
      spyOn(item['projectIdBridge_'], 'get').and.returnValue(null);

      let actualAsset = await item['getAsset_']();
      assert(actualAsset).to.beNull();
    });
  });

  describe('getHelper_', () => {
    it('should resolve with the correct helper', async (done: any) => {
      let helperId = 'helperId';
      spyOn(item['helperIdBridge_'], 'get').and.returnValue(helperId);

      let helper = Mocks.object('helper');
      let mockAsset = jasmine.createSpyObj('Asset', ['getHelper']);
      mockAsset.getHelper.and.returnValue(helper);
      spyOn(item, 'getAsset_').and.returnValue(Promise.resolve(mockAsset));

      let actualHelper = await item['getHelper_']();
      assert(actualHelper).to.equal(helper);
      assert(mockAsset.getHelper).to.haveBeenCalledWith(helperId);
    });

    it('should resolve with null if asset cannot be found', async (done: any) => {
      let helperId = 'helperId';
      spyOn(item['helperIdBridge_'], 'get').and.returnValue(helperId);

      spyOn(item, 'getAsset_').and.returnValue(Promise.resolve(null));

      let actualHelper = await item['getHelper_']();
      assert(actualHelper).to.beNull();
    });

    it('should resolve with null if there are no helper IDs', async (done: any) => {
      spyOn(item['helperIdBridge_'], 'get').and.returnValue(null);

      let actualHelper = await item['getHelper_']();
      assert(actualHelper).to.beNull();
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
    it('should delete the helper and update the asset and helper', async (done: any) => {
      let mockAsset = jasmine.createSpyObj('Asset', ['deleteHelper']);
      spyOn(item, 'getAsset_').and.returnValue(Promise.resolve(mockAsset));

      let helperId = 'helperId';
      let mockHelper = jasmine.createSpyObj('Helper', ['getId']);
      mockHelper.getId.and.returnValue(helperId);
      spyOn(item, 'getHelper_').and.returnValue(Promise.resolve(mockHelper));

      spyOn(item, 'updateHelper_');

      mockAssetCollection.update.and.returnValue(Promise.resolve());

      await item['onDeleteClick_']();
      assert(item['updateHelper_']).to.haveBeenCalledWith();
      assert(mockAssetCollection.update).to.haveBeenCalledWith(mockAsset);
      assert(mockAsset.deleteHelper).to.haveBeenCalledWith(helperId);
    });

    it('should do nothing if the asset cannot be found', async (done: any) => {
      spyOn(item, 'getAsset_').and.returnValue(Promise.resolve(null));

      let helperId = 'helperId';
      let mockHelper = jasmine.createSpyObj('Helper', ['getId']);
      mockHelper.getId.and.returnValue(helperId);
      spyOn(item, 'getHelper_').and.returnValue(Promise.resolve(mockHelper));

      spyOn(item, 'updateHelper_');

      mockAssetCollection.update.and.returnValue(Promise.resolve());

      await item['onDeleteClick_']();
      assert(item['updateHelper_']).toNot.haveBeenCalled();
    });

    it('should do nothing if the helper cannot be found', async (done: any) => {
      let mockAsset = jasmine.createSpyObj('Asset', ['deleteHelper']);
      spyOn(item, 'getAsset_').and.returnValue(Promise.resolve(mockAsset));
      spyOn(item, 'getHelper_').and.returnValue(Promise.resolve(null));

      spyOn(item, 'updateHelper_');

      mockAssetCollection.update.and.returnValue(Promise.resolve());

      await item['onDeleteClick_']();
      assert(item['updateHelper_']).toNot.haveBeenCalled();
    });
  });

  describe('onEditClick_', () => {
    it('should update the input name and set the root value to edit', async (done: any) => {
      let name = 'name';
      let mockHelper = jasmine.createSpyObj('Helper', ['getName']);
      mockHelper.getName.and.returnValue(name);
      spyOn(item, 'getHelper_').and.returnValue(Promise.resolve(mockHelper));
      spyOn(item['rootValueBridge_'], 'set');
      spyOn(item['nameInputBridge_'], 'set');

      await item['onEditClick_']();
      assert(item['rootValueBridge_'].set).to.haveBeenCalledWith('edit');
      assert(item['nameInputBridge_'].set).to.haveBeenCalledWith(name);
    });

    it('should delete the input name if the helper does not exist', async (done: any) => {
      spyOn(item, 'getHelper_').and.returnValue(Promise.resolve(null));
      spyOn(item['rootValueBridge_'], 'set');
      spyOn(item['nameInputBridge_'], 'delete');

      await item['onEditClick_']();
      assert(item['rootValueBridge_'].set).to.haveBeenCalledWith('edit');
      assert(item['nameInputBridge_'].delete).to.haveBeenCalledWith();
    });
  });

  describe('onNameClick_', () => {
    it('should navigate to the correct helper', async (done: any) => {
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

      await item['onNameClick_']();
      assert(mockRouteService.goTo).to.haveBeenCalledWith(
          helperRouteFactory,
          {assetId, helperId, projectId});
    });

    it('should do nothing if the asset does not exist', async (done: any) => {
      spyOn(item, 'getAsset_').and.returnValue(Promise.resolve(null));

      let mockHelper = jasmine.createSpyObj('Helper', ['getId']);
      mockHelper.getId.and.returnValue('helperId');
      spyOn(item, 'getHelper_').and.returnValue(Promise.resolve(mockHelper));

      await item['onNameClick_']();
      assert(mockRouteService.goTo).toNot.haveBeenCalled();
    });

    it('should do nothing if the helper cannot be found', async (done: any) => {
      let mockAsset = jasmine.createSpyObj('Asset', ['getId', 'getProjectId']);
      mockAsset.getId.and.returnValue('assetId');
      mockAsset.getProjectId.and.returnValue('projectId');
      spyOn(item, 'getAsset_').and.returnValue(Promise.resolve(mockAsset));

      spyOn(item, 'getHelper_').and.returnValue(Promise.resolve(null));

      await item['onNameClick_']();
      assert(mockRouteService.goTo).toNot.haveBeenCalled();
    });
  });

  describe('onOkClick_', () => {
    it('should update the helper, save the asset, and set the root value to read',
        async (done: any) => {
          let helperId = 'helperId';
          spyOn(item['helperIdBridge_'], 'get').and.returnValue(helperId);

          let mockHelper = jasmine.createSpyObj('Helper', ['setName']);
          let mockAsset = jasmine.createSpyObj('Asset', ['getHelper']);
          mockAsset.getHelper.and.returnValue(mockHelper);
          spyOn(item, 'getAsset_').and.returnValue(Promise.resolve(mockAsset));

          let name = 'name';
          spyOn(item['nameInputBridge_'], 'get').and.returnValue(name);
          spyOn(item['rootValueBridge_'], 'set');

          await item['onOkClick_']();
          assert(mockAssetCollection.update).to.haveBeenCalledWith(mockAsset);
          assert(item['rootValueBridge_'].set).to.haveBeenCalledWith('read');
          assert(mockHelper.setName).to.haveBeenCalledWith(name);
          assert(mockAsset.getHelper).to.haveBeenCalledWith(helperId);
        });

    it('should set the name to "" if null', async (done: any) => {
      let helperId = 'helperId';
      spyOn(item['helperIdBridge_'], 'get').and.returnValue(helperId);

      let mockHelper = jasmine.createSpyObj('Helper', ['setName']);
      let mockAsset = jasmine.createSpyObj('Asset', ['getHelper']);
      mockAsset.getHelper.and.returnValue(mockHelper);
      spyOn(item, 'getAsset_').and.returnValue(Promise.resolve(mockAsset));

      spyOn(item['nameInputBridge_'], 'get').and.returnValue(null);
      spyOn(item['rootValueBridge_'], 'set');

      await item['onOkClick_']();
      assert(mockHelper.setName).to.haveBeenCalledWith('');
    });

    it('should do nothing if the helper does not exist', async (done: any) => {
      let helperId = 'helperId';
      spyOn(item['helperIdBridge_'], 'get').and.returnValue(helperId);

      let mockAsset = jasmine.createSpyObj('Asset', ['getHelper']);
      mockAsset.getHelper.and.returnValue(null);
      spyOn(item, 'getAsset_').and.returnValue(Promise.resolve(mockAsset));

      let name = 'name';
      spyOn(item['nameInputBridge_'], 'get').and.returnValue(name);
      spyOn(item['rootValueBridge_'], 'set');

      await item['onOkClick_']();
      assert(mockAssetCollection.update).toNot.haveBeenCalled();
      assert(item['rootValueBridge_'].set).toNot.haveBeenCalled();
      assert(mockAsset.getHelper).to.haveBeenCalledWith(helperId);
    });

    it('should do nothing if the asset does not exist', async (done: any) => {
      let helperId = 'helperId';
      spyOn(item['helperIdBridge_'], 'get').and.returnValue(helperId);

      spyOn(item, 'getAsset_').and.returnValue(Promise.resolve(null));

      let name = 'name';
      spyOn(item['nameInputBridge_'], 'get').and.returnValue(name);
      spyOn(item['rootValueBridge_'], 'set');

      await item['onOkClick_']();
      assert(mockAssetCollection.update).toNot.haveBeenCalled();
      assert(item['rootValueBridge_'].set).toNot.haveBeenCalled();
    });

    it('should do nothing if the helper ID does not exist', async (done: any) => {
      spyOn(item['helperIdBridge_'], 'get').and.returnValue(null);

      spyOn(item['rootValueBridge_'], 'set');

      await item['onOkClick_']();
      assert(mockAssetCollection.update).toNot.haveBeenCalled();
      assert(item['rootValueBridge_'].set).toNot.haveBeenCalled();
    });
  });

  describe('updateHelper_', () => {
    it('should dispose the previous helper deregister, listen to the CHANGED event, and call ' +
        'helperUpdated_',
        async (done: any) => {
          let mockPreviousDeregister = jasmine.createSpyObj('PreviousDeregister', ['dispose']);
          item['helperUpdateDeregister_'] = mockPreviousDeregister;

          let mockDeregister = jasmine.createSpyObj('Deregister', ['dispose']);
          let mockHelper = jasmine.createSpyObj('Helper', ['on']);
          mockHelper.on.and.returnValue(mockDeregister);
          spyOn(item, 'getHelper_').and.returnValue(Promise.resolve(mockHelper));

          let onHelperUpdatedSpy = spyOn(item, 'onHelperUpdated_');

          await item['updateHelper_']();
          assert(item['onHelperUpdated_']).to.haveBeenCalledWith(mockHelper);

          assert(mockHelper.on).to
              .haveBeenCalledWith(DataEvents.CHANGED, Matchers.any(Function), item);
          onHelperUpdatedSpy.calls.reset();
          mockHelper.on.calls.argsFor(0)[1]();
          assert(item['onHelperUpdated_']).to.haveBeenCalledWith(mockHelper);
          assert(item['helperUpdateDeregister_']).to.equal(mockDeregister);

          assert(mockPreviousDeregister.dispose).to.haveBeenCalledWith();
        });

    it('should still dispose the previous helper deregister when the new helper is null',
        async (done: any) => {
          let mockPreviousDeregister = jasmine.createSpyObj('PreviousDeregister', ['dispose']);
          item['helperUpdateDeregister_'] = mockPreviousDeregister;

          spyOn(item, 'getHelper_').and.returnValue(Promise.resolve(null));
          spyOn(item, 'onHelperUpdated_');

          await item['updateHelper_']();
          assert(item['onHelperUpdated_']).toNot.haveBeenCalled();
          assert(mockPreviousDeregister.dispose).to.haveBeenCalledWith();
        });

    it('should not throw error if there are no previous helper deregisters', async (done: any) => {
      let mockHelper = jasmine.createSpyObj('Helper', ['on']);
      mockHelper.on.and.returnValue(jasmine.createSpyObj('Deregister', ['dispose']));
      spyOn(item, 'getHelper_').and.returnValue(Promise.resolve(mockHelper));

      spyOn(item, 'onHelperUpdated_');

      await item['updateHelper_']();
      assert(item['onHelperUpdated_']).to.haveBeenCalledWith(mockHelper);
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

  describe('onCreated', () => {
    it('should update the helper', () => {
      let element = Mocks.object('element');
      spyOn(item, 'updateHelper_');
      item.onCreated(element);
      assert(item['updateHelper_']).to.haveBeenCalledWith();
    });
  });
});

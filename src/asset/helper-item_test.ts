import { assert, Matchers, TestBase } from '../test-base';
TestBase.setup();

import { Mocks } from 'external/gs_tools/src/mock';
import { TestDispose } from 'external/gs_tools/src/testing';

import { DataEvents } from '../data/data-events';

import { HelperItem } from './helper-item';


describe('asset.HelperItem', () => {
  let mockAssetCollection;
  let mockOverlayService;
  let mockRouteFactoryService;
  let mockRouteService;
  let item: HelperItem;

  beforeEach(() => {
    mockAssetCollection = jasmine.createSpyObj('AssetCollection', ['get', 'update']);
    mockOverlayService = jasmine.createSpyObj('OverlayService', ['hideOverlay']);
    mockRouteFactoryService = jasmine.createSpyObj('RouteFactoryService', ['helper']);
    mockRouteService = jasmine.createSpyObj('RouteService', ['goTo']);
    item = new HelperItem(
        mockAssetCollection,
        mockOverlayService,
        mockRouteFactoryService,
        mockRouteService,
        jasmine.createSpyObj('ThemeService', ['applyTheme']));
    TestDispose.add(item);
  });

  describe('getAsset_', () => {
    it('should resolve with the correct asset', async () => {
      const projectId = 'projectId';
      const assetId = 'assetId';
      spyOn(item['assetIdHook_'], 'get').and.returnValue(assetId);
      spyOn(item['projectIdHook_'], 'get').and.returnValue(projectId);

      const asset = Mocks.object('asset');
      mockAssetCollection.get.and.returnValue(Promise.resolve(asset));

      const actualAsset = await item['getAsset_']();
      assert(actualAsset).to.equal(asset);
      assert(mockAssetCollection.get).to.haveBeenCalledWith(projectId, assetId);
    });

    it('should resolve with null if there are no asset IDs', async () => {
      const projectId = 'projectId';
      spyOn(item['assetIdHook_'], 'get').and.returnValue(null);
      spyOn(item['projectIdHook_'], 'get').and.returnValue(projectId);

      const actualAsset = await item['getAsset_']();
      assert(actualAsset).to.beNull();
    });

    it('should resolve with null if there are no project IDs', async () => {
      const assetId = 'assetId';
      spyOn(item['assetIdHook_'], 'get').and.returnValue(assetId);
      spyOn(item['projectIdHook_'], 'get').and.returnValue(null);

      const actualAsset = await item['getAsset_']();
      assert(actualAsset).to.beNull();
    });
  });

  describe('getHelper_', () => {
    it('should resolve with the correct helper', async () => {
      const helperId = 'helperId';
      spyOn(item['helperIdHook_'], 'get').and.returnValue(helperId);

      const helper = Mocks.object('helper');
      const mockAsset = jasmine.createSpyObj('Asset', ['getHelper']);
      mockAsset.getHelper.and.returnValue(helper);
      spyOn(item, 'getAsset_').and.returnValue(Promise.resolve(mockAsset));

      const actualHelper = await item['getHelper_']();
      assert(actualHelper).to.equal(helper);
      assert(mockAsset.getHelper).to.haveBeenCalledWith(helperId);
    });

    it('should resolve with null if asset cannot be found', async () => {
      const helperId = 'helperId';
      spyOn(item['helperIdHook_'], 'get').and.returnValue(helperId);

      spyOn(item, 'getAsset_').and.returnValue(Promise.resolve(null));

      const actualHelper = await item['getHelper_']();
      assert(actualHelper).to.beNull();
    });

    it('should resolve with null if there are no helper IDs', async () => {
      spyOn(item['helperIdHook_'], 'get').and.returnValue(null);

      const actualHelper = await item['getHelper_']();
      assert(actualHelper).to.beNull();
    });
  });

  describe('onHelperUpdated_', () => {
    it('should set the name bridge correctly', () => {
      const name = 'name';
      const mockHelper = jasmine.createSpyObj('Helper', ['getName']);
      mockHelper.getName.and.returnValue(name);
      spyOn(item['nameHook_'], 'set');

      item['onHelperUpdated_'](mockHelper);

      assert(item['nameHook_'].set).to.haveBeenCalledWith(name);
    });
  });

  describe('onCancelClick_', () => {
    it('should set the root value to read', () => {
      const mockEvent = jasmine.createSpyObj('Event', ['stopPropagation']);
      spyOn(item['rootValueHook_'], 'set');
      item['onCancelClick_'](mockEvent);
      assert(item['rootValueHook_'].set).to.haveBeenCalledWith('read');
      assert(mockEvent.stopPropagation).to.haveBeenCalledWith();
    });
  });

  describe('onDeleteClick_', () => {
    it('should delete the helper and update the asset and helper', async () => {
      const mockAsset = jasmine.createSpyObj('Asset', ['deleteHelper']);
      spyOn(item, 'getAsset_').and.returnValue(Promise.resolve(mockAsset));

      const helperId = 'helperId';
      const mockHelper = jasmine.createSpyObj('Helper', ['getId']);
      mockHelper.getId.and.returnValue(helperId);
      spyOn(item, 'getHelper_').and.returnValue(Promise.resolve(mockHelper));

      spyOn(item, 'updateHelper_');

      mockAssetCollection.update.and.returnValue(Promise.resolve());

      const mockEvent = jasmine.createSpyObj('Event', ['stopPropagation']);

      await item['onDeleteClick_'](mockEvent);
      assert(item['updateHelper_']).to.haveBeenCalledWith();
      assert(mockAssetCollection.update).to.haveBeenCalledWith(mockAsset);
      assert(mockAsset.deleteHelper).to.haveBeenCalledWith(helperId);
      assert(mockEvent.stopPropagation).to.haveBeenCalledWith();
    });

    it('should do nothing if the asset cannot be found', async () => {
      spyOn(item, 'getAsset_').and.returnValue(Promise.resolve(null));

      const helperId = 'helperId';
      const mockHelper = jasmine.createSpyObj('Helper', ['getId']);
      mockHelper.getId.and.returnValue(helperId);
      spyOn(item, 'getHelper_').and.returnValue(Promise.resolve(mockHelper));

      spyOn(item, 'updateHelper_');

      mockAssetCollection.update.and.returnValue(Promise.resolve());

      const mockEvent = jasmine.createSpyObj('Event', ['stopPropagation']);

      await item['onDeleteClick_'](mockEvent);
      assert(item['updateHelper_']).toNot.haveBeenCalled();
      assert(mockEvent.stopPropagation).to.haveBeenCalledWith();
    });

    it('should do nothing if the helper cannot be found', async () => {
      const mockAsset = jasmine.createSpyObj('Asset', ['deleteHelper']);
      spyOn(item, 'getAsset_').and.returnValue(Promise.resolve(mockAsset));
      spyOn(item, 'getHelper_').and.returnValue(Promise.resolve(null));

      spyOn(item, 'updateHelper_');

      mockAssetCollection.update.and.returnValue(Promise.resolve());

      const mockEvent = jasmine.createSpyObj('Event', ['stopPropagation']);

      await item['onDeleteClick_'](mockEvent);
      assert(item['updateHelper_']).toNot.haveBeenCalled();
      assert(mockEvent.stopPropagation).to.haveBeenCalledWith();
    });
  });

  describe('onEditClick_', () => {
    it('should update the input name and set the root value to edit', async () => {
      const name = 'name';
      const mockHelper = jasmine.createSpyObj('Helper', ['getName']);
      mockHelper.getName.and.returnValue(name);
      spyOn(item, 'getHelper_').and.returnValue(Promise.resolve(mockHelper));
      spyOn(item['rootValueHook_'], 'set');
      spyOn(item['nameInputHook_'], 'set');

      const mockEvent = jasmine.createSpyObj('Event', ['stopPropagation']);

      await item['onEditClick_'](mockEvent);
      assert(item['rootValueHook_'].set).to.haveBeenCalledWith('edit');
      assert(item['nameInputHook_'].set).to.haveBeenCalledWith(name);
      assert(mockEvent.stopPropagation).to.haveBeenCalledWith();
    });

    it('should delete the input name if the helper does not exist', async () => {
      spyOn(item, 'getHelper_').and.returnValue(Promise.resolve(null));
      spyOn(item['rootValueHook_'], 'set');
      spyOn(item['nameInputHook_'], 'delete');

      const mockEvent = jasmine.createSpyObj('Event', ['stopPropagation']);

      await item['onEditClick_'](mockEvent);
      assert(item['rootValueHook_'].set).to.haveBeenCalledWith('edit');
      assert(item['nameInputHook_'].delete).to.haveBeenCalledWith();
      assert(mockEvent.stopPropagation).to.haveBeenCalledWith();
    });
  });

  describe('onOkClick_', () => {
    it('should update the helper, save the asset, and set the root value to read',
        async () => {
          const helperId = 'helperId';
          spyOn(item['helperIdHook_'], 'get').and.returnValue(helperId);

          const mockHelper = jasmine.createSpyObj('Helper', ['setName']);
          const mockAsset = jasmine.createSpyObj('Asset', ['getHelper']);
          mockAsset.getHelper.and.returnValue(mockHelper);
          spyOn(item, 'getAsset_').and.returnValue(Promise.resolve(mockAsset));

          const name = 'name';
          spyOn(item['nameInputHook_'], 'get').and.returnValue(name);
          spyOn(item['rootValueHook_'], 'set');

          const mockEvent = jasmine.createSpyObj('Event', ['stopPropagation']);

          await item['onOkClick_'](mockEvent);
          assert(mockAssetCollection.update).to.haveBeenCalledWith(mockAsset);
          assert(item['rootValueHook_'].set).to.haveBeenCalledWith('read');
          assert(mockHelper.setName).to.haveBeenCalledWith(name);
          assert(mockAsset.getHelper).to.haveBeenCalledWith(helperId);
          assert(mockEvent.stopPropagation).to.haveBeenCalledWith();
        });

    it('should set the name to "" if null', async () => {
      const helperId = 'helperId';
      spyOn(item['helperIdHook_'], 'get').and.returnValue(helperId);

      const mockHelper = jasmine.createSpyObj('Helper', ['setName']);
      const mockAsset = jasmine.createSpyObj('Asset', ['getHelper']);
      mockAsset.getHelper.and.returnValue(mockHelper);
      spyOn(item, 'getAsset_').and.returnValue(Promise.resolve(mockAsset));

      spyOn(item['nameInputHook_'], 'get').and.returnValue(null);
      spyOn(item['rootValueHook_'], 'set');

      const mockEvent = jasmine.createSpyObj('Event', ['stopPropagation']);

      await item['onOkClick_'](mockEvent);
      assert(mockHelper.setName).to.haveBeenCalledWith('');
      assert(mockEvent.stopPropagation).to.haveBeenCalledWith();
    });

    it('should do nothing if the helper does not exist', async () => {
      const helperId = 'helperId';
      spyOn(item['helperIdHook_'], 'get').and.returnValue(helperId);

      const mockAsset = jasmine.createSpyObj('Asset', ['getHelper']);
      mockAsset.getHelper.and.returnValue(null);
      spyOn(item, 'getAsset_').and.returnValue(Promise.resolve(mockAsset));

      const name = 'name';
      spyOn(item['nameInputHook_'], 'get').and.returnValue(name);
      spyOn(item['rootValueHook_'], 'set');

      const mockEvent = jasmine.createSpyObj('Event', ['stopPropagation']);

      await item['onOkClick_'](mockEvent);
      assert(mockAssetCollection.update).toNot.haveBeenCalled();
      assert(item['rootValueHook_'].set).toNot.haveBeenCalled();
      assert(mockAsset.getHelper).to.haveBeenCalledWith(helperId);
      assert(mockEvent.stopPropagation).to.haveBeenCalledWith();
    });

    it('should do nothing if the asset does not exist', async () => {
      const helperId = 'helperId';
      spyOn(item['helperIdHook_'], 'get').and.returnValue(helperId);

      spyOn(item, 'getAsset_').and.returnValue(Promise.resolve(null));

      const name = 'name';
      spyOn(item['nameInputHook_'], 'get').and.returnValue(name);
      spyOn(item['rootValueHook_'], 'set');

      const mockEvent = jasmine.createSpyObj('Event', ['stopPropagation']);

      await item['onOkClick_'](mockEvent);
      assert(mockAssetCollection.update).toNot.haveBeenCalled();
      assert(item['rootValueHook_'].set).toNot.haveBeenCalled();
      assert(mockEvent.stopPropagation).to.haveBeenCalledWith();
    });

    it('should do nothing if the helper ID does not exist', async () => {
      spyOn(item['helperIdHook_'], 'get').and.returnValue(null);

      spyOn(item['rootValueHook_'], 'set');

      const mockEvent = jasmine.createSpyObj('Event', ['stopPropagation']);

      await item['onOkClick_'](mockEvent);
      assert(mockAssetCollection.update).toNot.haveBeenCalled();
      assert(item['rootValueHook_'].set).toNot.haveBeenCalled();
      assert(mockEvent.stopPropagation).to.haveBeenCalledWith();
    });
  });

  describe('onReadRootClick_', () => {
    it('should navigate to the correct helper', async () => {
      const assetId = 'assetId';
      const projectId = 'projectId';
      const mockAsset = jasmine.createSpyObj('Asset', ['getId', 'getProjectId']);
      mockAsset.getId.and.returnValue(assetId);
      mockAsset.getProjectId.and.returnValue(projectId);
      spyOn(item, 'getAsset_').and.returnValue(Promise.resolve(mockAsset));

      const helperId = 'helperId';
      const mockHelper = jasmine.createSpyObj('Helper', ['getId']);
      mockHelper.getId.and.returnValue(helperId);
      spyOn(item, 'getHelper_').and.returnValue(Promise.resolve(mockHelper));

      const helperRouteFactory = Mocks.object('helperRouteFactory');
      mockRouteFactoryService.helper.and.returnValue(helperRouteFactory);

      await item['onReadRootClick_']();
      assert(mockRouteService.goTo).to.haveBeenCalledWith(
          helperRouteFactory,
          {assetId, helperId, projectId});
    });

    it('should do nothing if the asset does not exist', async () => {
      spyOn(item, 'getAsset_').and.returnValue(Promise.resolve(null));

      const mockHelper = jasmine.createSpyObj('Helper', ['getId']);
      mockHelper.getId.and.returnValue('helperId');
      spyOn(item, 'getHelper_').and.returnValue(Promise.resolve(mockHelper));

      await item['onReadRootClick_']();
      assert(mockRouteService.goTo).toNot.haveBeenCalled();
    });

    it('should do nothing if the helper cannot be found', async () => {
      const mockAsset = jasmine.createSpyObj('Asset', ['getId', 'getProjectId']);
      mockAsset.getId.and.returnValue('assetId');
      mockAsset.getProjectId.and.returnValue('projectId');
      spyOn(item, 'getAsset_').and.returnValue(Promise.resolve(mockAsset));

      spyOn(item, 'getHelper_').and.returnValue(Promise.resolve(null));

      await item['onReadRootClick_']();
      assert(mockRouteService.goTo).toNot.haveBeenCalled();
    });
  });

  describe('updateHelper_', () => {
    it('should dispose the previous helper deregister, listen to the CHANGED event, and call ' +
        'helperUpdated_',
        async () => {
          const mockPreviousDeregister = jasmine.createSpyObj('PreviousDeregister', ['dispose']);
          item['helperUpdateDeregister_'] = mockPreviousDeregister;

          const mockDeregister = jasmine.createSpyObj('Deregister', ['dispose']);
          const mockHelper = jasmine.createSpyObj('Helper', ['on']);
          mockHelper.on.and.returnValue(mockDeregister);
          spyOn(item, 'getHelper_').and.returnValue(Promise.resolve(mockHelper));

          const onHelperUpdatedSpy = spyOn(item, 'onHelperUpdated_');

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
        async () => {
          const mockPreviousDeregister = jasmine.createSpyObj('PreviousDeregister', ['dispose']);
          item['helperUpdateDeregister_'] = mockPreviousDeregister;

          spyOn(item, 'getHelper_').and.returnValue(Promise.resolve(null));
          spyOn(item, 'onHelperUpdated_');

          await item['updateHelper_']();
          assert(item['onHelperUpdated_']).toNot.haveBeenCalled();
          assert(mockPreviousDeregister.dispose).to.haveBeenCalledWith();
        });

    it('should not throw error if there are no previous helper deregisters', async () => {
      const mockHelper = jasmine.createSpyObj('Helper', ['on']);
      mockHelper.on.and.returnValue(jasmine.createSpyObj('Deregister', ['dispose']));
      spyOn(item, 'getHelper_').and.returnValue(Promise.resolve(mockHelper));

      spyOn(item, 'onHelperUpdated_');

      await item['updateHelper_']();
      assert(item['onHelperUpdated_']).to.haveBeenCalledWith(mockHelper);
    });
  });

  describe('disposeInternal', () => {
    it('should dispose the deregister function', () => {
      const mockDeregister = jasmine.createSpyObj('Deregister', ['dispose']);
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
      const element = Mocks.object('element');
      spyOn(item, 'updateHelper_');
      item.onCreated(element);
      assert(item['updateHelper_']).to.haveBeenCalledWith();
    });
  });
});

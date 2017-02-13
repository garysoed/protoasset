import {assert, Matchers, TestBase} from '../test-base';
TestBase.setup();

import {Mocks} from 'external/gs_tools/src/mock';
import {TestDispose} from 'external/gs_tools/src/testing';

import {DataEvents} from '../data/data-events';

import {LayerItem, Mode} from './layer-item';


describe('asset.LayerItem', () => {
  let mockAssetCollection;
  let item: LayerItem;

  beforeEach(() => {
    mockAssetCollection = jasmine.createSpyObj('AssetCollection', ['get', 'update']);
    item = new LayerItem(mockAssetCollection, Mocks.object('ThemeService'));
    TestDispose.add(item);
  });

  describe('disposeInternal', () => {
    it('should dispose the asset and layer deregisters', () => {
      const mockAssetDeregister = jasmine.createSpyObj('AssetDeregister', ['dispose']);
      item['assetDeregister_'] = mockAssetDeregister;

      const mockLayerDeregister = jasmine.createSpyObj('LayerDeregister', ['dispose']);
      item['layerDeregister_'] = mockLayerDeregister;

      item.disposeInternal();

      assert(mockAssetDeregister.dispose).to.haveBeenCalledWith();
      assert(mockLayerDeregister.dispose).to.haveBeenCalledWith();
    });

    it('should not throw error if there are no asset or layer deregisters', () => {
      assert(() => {
        item.disposeInternal();
      }).toNot.throw();
    });
  });

  describe('getAsset_', () => {
    it('should resolve with the correct asset', async (done: any) => {
      const assetId = 'assetId';
      const projectId = 'projectId';
      spyOn(item['assetIdHook_'], 'get').and.returnValue(assetId);
      spyOn(item['projectIdHook_'], 'get').and.returnValue(projectId);

      const asset = Mocks.object('asset');
      mockAssetCollection.get.and.returnValue(Promise.resolve(asset));

      assert(await item['getAsset_']()).to.equal(asset);
      assert(mockAssetCollection.get).to.haveBeenCalledWith(projectId, assetId);
    });

    it('should resolve with null if there are no asset IDs', async (done: any) => {
      spyOn(item['assetIdHook_'], 'get').and.returnValue(null);
      spyOn(item['projectIdHook_'], 'get').and.returnValue('projectId');

      const asset = Mocks.object('asset');
      mockAssetCollection.get.and.returnValue(Promise.resolve(asset));

      assert(await item['getAsset_']()).to.beNull();
    });

    it('should resolve with null if there are no project IDs', async (done: any) => {
      spyOn(item['assetIdHook_'], 'get').and.returnValue('assetId');
      spyOn(item['projectIdHook_'], 'get').and.returnValue(null);

      const asset = Mocks.object('asset');
      mockAssetCollection.get.and.returnValue(Promise.resolve(asset));

      assert(await item['getAsset_']()).to.beNull();
    });
  });

  describe('getLayer_', () => {
    it('should resolve with the correct layer', async (done: any) => {
      const layerId = 'layerId';
      spyOn(item['layerIdHook_'], 'get').and.returnValue(layerId);

      const mockLayer = jasmine.createSpyObj('Layer', ['getId']);
      mockLayer.getId.and.returnValue(layerId);

      const mockAsset = jasmine.createSpyObj('Asset', ['getLayers']);
      mockAsset.getLayers.and.returnValue([
        jasmine.createSpyObj('OtherLayer', ['getId']),
        mockLayer,
      ]);
      spyOn(item, 'getAsset_').and.returnValue(Promise.resolve(mockAsset));

      assert(await item['getLayer_']()).to.equal(mockLayer);
    });

    it('should resolve with null if there are no matching layers', async (done: any) => {
      const layerId = 'layerId';
      spyOn(item['layerIdHook_'], 'get').and.returnValue(layerId);

      const mockLayer = jasmine.createSpyObj('Layer', ['getId']);
      mockLayer.getId.and.returnValue(layerId);

      const mockAsset = jasmine.createSpyObj('Asset', ['getLayers']);
      mockAsset.getLayers.and.returnValue([
        jasmine.createSpyObj('OtherLayer', ['getId']),
      ]);
      spyOn(item, 'getAsset_').and.returnValue(Promise.resolve(mockAsset));

      assert(await item['getLayer_']()).to.beNull();
    });

    it('should resolve with null if there are no assets', async (done: any) => {
      const layerId = 'layerId';
      spyOn(item['layerIdHook_'], 'get').and.returnValue(layerId);

      spyOn(item, 'getAsset_').and.returnValue(Promise.resolve(null));

      assert(await item['getLayer_']()).to.beNull();
    });

    it('should resolve with null if there are no layer IDs', async (done: any) => {
      spyOn(item['layerIdHook_'], 'get').and.returnValue(null);
      assert(await item['getLayer_']()).to.beNull();
    });
  });

  describe('onAssetIdChanged_', () => {
    it('should call layerIdChanged_, update layer position, listen to asset change, and dispose '
        + 'previous asset deregister',
        async (done: any) => {
          const mockOldDeregister = jasmine.createSpyObj('OldDeregister', ['dispose']);
          item['assetDeregister_'] = mockOldDeregister;

          const mockDeregister = jasmine.createSpyObj('Deregister', ['dispose']);
          const mockAsset = jasmine.createSpyObj('Asset', ['on']);
          mockAsset.on.and.returnValue(mockDeregister);
          spyOn(item, 'getAsset_').and.returnValue(Promise.resolve(mockAsset));

          spyOn(item, 'updateLayerPosition_');
          spyOn(item, 'onLayerIdChanged_');

          await item['onAssetIdChanged_']();

          assert(item['onLayerIdChanged_']).to.haveBeenCalledWith();
          assert(item['updateLayerPosition_']).to.haveBeenCalledWith();
          assert(item['assetDeregister_']).to.equal(mockDeregister);
          assert(mockAsset.on).to
              .haveBeenCalledWith(DataEvents.CHANGED, item['updateLayerPosition_'], item);
          assert(mockOldDeregister.dispose).to.haveBeenCalledWith();
        });

    it('should only dispose previous asset deregister if the asset cannot be found',
        async (done: any) => {
          const mockOldDeregister = jasmine.createSpyObj('OldDeregister', ['dispose']);
          item['assetDeregister_'] = mockOldDeregister;

          spyOn(item, 'getAsset_').and.returnValue(Promise.resolve(null));

          spyOn(item, 'updateLayerPosition_');
          spyOn(item, 'onLayerIdChanged_');

          await item['onAssetIdChanged_']();

          assert(item['onLayerIdChanged_']).toNot.haveBeenCalled();
          assert(item['updateLayerPosition_']).toNot.haveBeenCalled();
          assert(item['assetDeregister_']).to.beNull();
          assert(mockOldDeregister.dispose).to.haveBeenCalledWith();
        });

    it('should not reject if there are no previous asset deregisters', async (done: any) => {
      const mockDeregister = jasmine.createSpyObj('Deregister', ['dispose']);
      const mockAsset = jasmine.createSpyObj('Asset', ['on']);
      mockAsset.on.and.returnValue(mockDeregister);
      spyOn(item, 'getAsset_').and.returnValue(Promise.resolve(mockAsset));

      spyOn(item, 'updateLayerPosition_');
      spyOn(item, 'onLayerIdChanged_');

      await item['onAssetIdChanged_']();
    });
  });

  describe('onChangeModeClick_', () => {
    it('should set the root mode correctly and stop propagation', () => {
      const mockEvent = jasmine.createSpyObj('Event', ['stopPropagation']);
      const mode = Mode.EDIT;
      spyOn(item.rootModeHook_, 'set');
      item.onChangeModeClick_(mode, mockEvent);
      assert(item.rootModeHook_.set).to.haveBeenCalledWith(mode);
      assert(mockEvent.stopPropagation).to.haveBeenCalledWith();
    });
  });

  describe('onDeleteClick_', () => {
    it('should remove the layer, update the asset and stop the event propagation',
        async (done: any) => {
          const layer = Mocks.object('layer');
          spyOn(item, 'getLayer_').and.returnValue(Promise.resolve(layer));

          const mockAsset = jasmine.createSpyObj('Asset', ['removeLayer']);
          spyOn(item, 'getAsset_').and.returnValue(Promise.resolve(mockAsset));

          const mockEvent = jasmine.createSpyObj('Event', ['stopPropagation']);

          await item.onDeleteClick_(mockEvent);
          assert(mockAssetCollection.update).to.haveBeenCalledWith(mockAsset);
          assert(mockAsset.removeLayer).to.haveBeenCalledWith(layer);
          assert(mockEvent.stopPropagation).to.haveBeenCalledWith();
        });

    it('should not update the asset if there are no assets', async (done: any) => {
      const layer = Mocks.object('layer');
      spyOn(item, 'getLayer_').and.returnValue(Promise.resolve(layer));
      spyOn(item, 'getAsset_').and.returnValue(Promise.resolve(null));

      const mockEvent = jasmine.createSpyObj('Event', ['stopPropagation']);

      await item.onDeleteClick_(mockEvent);
      assert(mockAssetCollection.update).toNot.haveBeenCalled();
      assert(mockEvent.stopPropagation).to.haveBeenCalledWith();
    });

    it('should not update the asset if there are no layers', async (done: any) => {
      spyOn(item, 'getLayer_').and.returnValue(Promise.resolve(null));

      const mockAsset = jasmine.createSpyObj('Asset', ['removeLayer']);
      spyOn(item, 'getAsset_').and.returnValue(Promise.resolve(mockAsset));

      const mockEvent = jasmine.createSpyObj('Event', ['stopPropagation']);

      await item.onDeleteClick_(mockEvent);
      assert(mockAssetCollection.update).toNot.haveBeenCalled();
      assert(mockEvent.stopPropagation).to.haveBeenCalledWith();
    });
  });

  describe('onLayerChanged_', () => {
    it('should update the UI correctly', () => {
      const name = 'name';
      const mockLayer = jasmine.createSpyObj('Layer', ['getName']);
      mockLayer.getName.and.returnValue(name);

      spyOn(item['nameHook_'], 'set');
      spyOn(item['nameInputHook_'], 'set');

      item['onLayerChanged_'](mockLayer);
      assert(item['nameHook_'].set).to.haveBeenCalledWith(name);
      assert(item['nameInputHook_'].set).to.haveBeenCalledWith(name);
    });
  });

  describe('onLayerIdChanged_', () => {
    it('should call layedChanged, listen to layer change, update layer position, and dispose '
        + 'previous layer deregister',
        async (done: any) => {
          const mockOldDeregister = jasmine.createSpyObj('OldDeregister', ['dispose']);
          item['layerDeregister_'] = mockOldDeregister;

          const mockDeregister = jasmine.createSpyObj('Deregister', ['dispose']);
          const mockLayer = jasmine.createSpyObj('Layer', ['on']);
          mockLayer.on.and.returnValue(mockDeregister);
          spyOn(item, 'getLayer_').and.returnValue(Promise.resolve(mockLayer));

          let spyLayerChanged = spyOn(item, 'onLayerChanged_');
          spyOn(item, 'updateLayerPosition_');

          await item['onLayerIdChanged_']();
          assert(item['updateLayerPosition_']).to.haveBeenCalledWith();
          assert(item['onLayerChanged_']).to.haveBeenCalledWith(mockLayer);
          assert(item['layerDeregister_']).to.equal(mockDeregister);

          assert(mockLayer.on).to
              .haveBeenCalledWith(DataEvents.CHANGED, Matchers.any(Function), item);
          spyLayerChanged.calls.reset();
          mockLayer.on.calls.argsFor(0)[1]();
          assert(item['onLayerChanged_']).to.haveBeenCalledWith(mockLayer);

          assert(mockOldDeregister.dispose).to.haveBeenCalledWith();
        });

    it('should only deregister previous layer deregister if layer cannot be found',
        async (done: any) => {
          const mockOldDeregister = jasmine.createSpyObj('OldDeregister', ['dispose']);
          item['layerDeregister_'] = mockOldDeregister;

          spyOn(item, 'getLayer_').and.returnValue(Promise.resolve(null));

          spyOn(item, 'onLayerChanged_');
          spyOn(item, 'updateLayerPosition_');

          await item['onLayerIdChanged_']();
          assert(item['updateLayerPosition_']).toNot.haveBeenCalled();
          assert(item['onLayerChanged_']).toNot.haveBeenCalled();
          assert(item['layerDeregister_']).to.beNull();

          assert(mockOldDeregister.dispose).to.haveBeenCalledWith();
        });

    it('should not reject if there are no previous layer deregisters', async (done: any) => {
      const mockDeregister = jasmine.createSpyObj('Deregister', ['dispose']);
      const mockLayer = jasmine.createSpyObj('Layer', ['on']);
      mockLayer.on.and.returnValue(mockDeregister);
      spyOn(item, 'getLayer_').and.returnValue(Promise.resolve(mockLayer));

      spyOn(item, 'onLayerChanged_');
      spyOn(item, 'updateLayerPosition_');

      await item['onLayerIdChanged_']();
    });
  });

  describe('onOkClick_', () => {
    it('should update the layer and asset and sets the mode to READ', async (done: any) => {
      const name = 'name';
      spyOn(item['nameInputHook_'], 'get').and.returnValue(name);

      const mockLayer = jasmine.createSpyObj('Layer', ['setName']);
      spyOn(item, 'getLayer_').and.returnValue(Promise.resolve(mockLayer));

      const asset = Mocks.object('asset');
      spyOn(item, 'getAsset_').and.returnValue(Promise.resolve(asset));
      spyOn(item.rootModeHook_, 'set');

      const mockEvent = jasmine.createSpyObj('Event', ['stopPropagation']);

      await item['onOkClick_'](mockEvent);

      assert(item.rootModeHook_.set).to.haveBeenCalledWith(Mode.READ);
      assert(mockAssetCollection.update).to.haveBeenCalledWith(asset);
      assert(mockLayer.setName).to.haveBeenCalledWith(name);
      assert(mockEvent.stopPropagation).to.haveBeenCalledWith();
    });

    it('should do nothing if asset cannot be found', async (done: any) => {
      const mockLayer = jasmine.createSpyObj('Layer', ['setName']);
      spyOn(item, 'getLayer_').and.returnValue(Promise.resolve(mockLayer));

      spyOn(item, 'getAsset_').and.returnValue(Promise.resolve(null));
      spyOn(item.rootModeHook_, 'set');

      const mockEvent = jasmine.createSpyObj('Event', ['stopPropagation']);

      await item['onOkClick_'](mockEvent);

      assert(item.rootModeHook_.set).toNot.haveBeenCalled();
      assert(mockAssetCollection.update).toNot.haveBeenCalled();
      assert(mockEvent.stopPropagation).to.haveBeenCalledWith();
    });

    it('should do nothing if layer cannot be found', async (done: any) => {
      spyOn(item, 'getLayer_').and.returnValue(Promise.resolve(null));

      spyOn(item, 'getAsset_').and.returnValue(Promise.resolve(Mocks.object('asset')));
      spyOn(item.rootModeHook_, 'set');

      const mockEvent = jasmine.createSpyObj('Event', ['stopPropagation']);

      await item['onOkClick_'](mockEvent);

      assert(item.rootModeHook_.set).toNot.haveBeenCalled();
      assert(mockAssetCollection.update).toNot.haveBeenCalled();
      assert(mockEvent.stopPropagation).to.haveBeenCalledWith();
    });
  });

  describe('onMoveButtonClick_', () => {
    it('should move the layer correctly, update the asset, and stop the event propagation',
        async (done: any) => {
          const moveIndex = 123;
          const layer = Mocks.object('layer');
          spyOn(item, 'getLayer_').and.returnValue(Promise.resolve(layer));

          const mockAsset = jasmine.createSpyObj('Asset', ['getLayers', 'insertLayer']);
          mockAsset.getLayers.and.returnValue([
            Mocks.object('otherLayer1'),
            layer,
            Mocks.object('otherLayer2'),
          ]);
          spyOn(item, 'getAsset_').and.returnValue(Promise.resolve(mockAsset));

          const mockEvent = jasmine.createSpyObj('Event', ['stopPropagation']);

          await item.onMoveButtonClick_(moveIndex, mockEvent);
          assert(mockAssetCollection.update).to.haveBeenCalledWith(mockAsset);
          assert(mockAsset.insertLayer).to.haveBeenCalledWith(layer, 1 + moveIndex);
          assert(mockEvent.stopPropagation).to.haveBeenCalledWith();
        });

    it('should not update the asset if the layer is not in the asset', async (done: any) => {
      const moveIndex = 123;
      spyOn(item, 'getLayer_').and.returnValue(Promise.resolve(null));

      const mockAsset = jasmine.createSpyObj('Asset', ['getLayers', 'insertLayer']);
      mockAsset.getLayers.and.returnValue([
        Mocks.object('otherLayer1'),
        Mocks.object('otherLayer2'),
      ]);
      spyOn(item, 'getAsset_').and.returnValue(Promise.resolve(mockAsset));

      const mockEvent = jasmine.createSpyObj('Event', ['stopPropagation']);

      await item.onMoveButtonClick_(moveIndex, mockEvent);
      assert(mockAssetCollection.update).toNot.haveBeenCalled();
      assert(mockEvent.stopPropagation).to.haveBeenCalledWith();
    });

    it('should not update the asset if there are no assets', async (done: any) => {
      const moveIndex = 123;
      const layer = Mocks.object('layer');
      spyOn(item, 'getLayer_').and.returnValue(Promise.resolve(layer));
      spyOn(item, 'getAsset_').and.returnValue(Promise.resolve(null));

      const mockEvent = jasmine.createSpyObj('Event', ['stopPropagation']);

      await item.onMoveButtonClick_(moveIndex, mockEvent);
      assert(mockAssetCollection.update).toNot.haveBeenCalled();
      assert(mockEvent.stopPropagation).to.haveBeenCalledWith();
    });

    it('should not update the asset if there are no layers', async (done: any) => {
      const moveIndex = 123;
      spyOn(item, 'getLayer_').and.returnValue(Promise.resolve(null));

      const mockAsset = jasmine.createSpyObj('Asset', ['getLayers', 'insertLayer']);
      mockAsset.getLayers.and.returnValue([]);
      spyOn(item, 'getAsset_').and.returnValue(Promise.resolve(mockAsset));

      const mockEvent = jasmine.createSpyObj('Event', ['stopPropagation']);

      await item.onMoveButtonClick_(moveIndex, mockEvent);
      assert(mockAssetCollection.update).toNot.haveBeenCalled();
      assert(mockEvent.stopPropagation).to.haveBeenCalledWith();
    });
  });

  describe('updateLayerPosition_', () => {
    it('should enable the up and down buttons if the layer is in the middle',
        async (done: any) => {
          const layer = Mocks.object('layer');
          spyOn(item, 'getLayer_').and.returnValue(Promise.resolve(layer));

          const mockAsset = jasmine.createSpyObj('Asset', ['getLayers']);
          mockAsset.getLayers.and.returnValue([
            Mocks.object('layer1'),
            layer,
            Mocks.object('layer2'),
          ]);
          spyOn(item, 'getAsset_').and.returnValue(Promise.resolve(mockAsset));

          spyOn(item.downDisabledHook_, 'set');
          spyOn(item.upDisabledHook_, 'set');

          await item['updateLayerPosition_']();

          assert(item.downDisabledHook_.set).to.haveBeenCalledWith(false);
          assert(item.upDisabledHook_.set).to.haveBeenCalledWith(false);
        });

    it('should disable the up arrow if the layer is at the top', async (done: any) => {
      const layer = Mocks.object('layer');
      spyOn(item, 'getLayer_').and.returnValue(Promise.resolve(layer));

      const mockAsset = jasmine.createSpyObj('Asset', ['getLayers']);
      mockAsset.getLayers.and.returnValue([
        layer,
        Mocks.object('otherLayer'),
      ]);
      spyOn(item, 'getAsset_').and.returnValue(Promise.resolve(mockAsset));

      spyOn(item.downDisabledHook_, 'set');
      spyOn(item.upDisabledHook_, 'set');

      await item['updateLayerPosition_']();

      assert(item.downDisabledHook_.set).to.haveBeenCalledWith(false);
      assert(item.upDisabledHook_.set).to.haveBeenCalledWith(true);
    });

    it('should disable the down arrow if the layer is at the bottom', async (done: any) => {
      const layer = Mocks.object('layer');
      spyOn(item, 'getLayer_').and.returnValue(Promise.resolve(layer));

      const mockAsset = jasmine.createSpyObj('Asset', ['getLayers']);
      mockAsset.getLayers.and.returnValue([
        Mocks.object('otherLayer'),
        layer,
      ]);
      spyOn(item, 'getAsset_').and.returnValue(Promise.resolve(mockAsset));

      spyOn(item.downDisabledHook_, 'set');
      spyOn(item.upDisabledHook_, 'set');

      await item['updateLayerPosition_']();

      assert(item.downDisabledHook_.set).to.haveBeenCalledWith(true);
      assert(item.upDisabledHook_.set).to.haveBeenCalledWith(false);
    });

    it('should do nothing if the layer cannot be found in the array', async (done: any) => {
      const layer = Mocks.object('layer');
      spyOn(item, 'getLayer_').and.returnValue(Promise.resolve(layer));

      const mockAsset = jasmine.createSpyObj('Asset', ['getLayers']);
      mockAsset.getLayers.and.returnValue([
        Mocks.object('otherLayer'),
      ]);
      spyOn(item, 'getAsset_').and.returnValue(Promise.resolve(mockAsset));

      spyOn(item.downDisabledHook_, 'set');
      spyOn(item.upDisabledHook_, 'set');

      await item['updateLayerPosition_']();

      assert(item.downDisabledHook_.set).toNot.haveBeenCalled();
      assert(item.upDisabledHook_.set).toNot.haveBeenCalled();
    });

    it('should do nothing if the asset cannot be found', async (done: any) => {
      const layer = Mocks.object('layer');
      spyOn(item, 'getLayer_').and.returnValue(Promise.resolve(layer));

      spyOn(item, 'getAsset_').and.returnValue(Promise.resolve(null));

      spyOn(item.downDisabledHook_, 'set');
      spyOn(item.upDisabledHook_, 'set');

      await item['updateLayerPosition_']();

      assert(item.downDisabledHook_.set).toNot.haveBeenCalled();
      assert(item.upDisabledHook_.set).toNot.haveBeenCalled();
    });

    it('should do nothing if the layer cannot be found', async (done: any) => {
      spyOn(item, 'getLayer_').and.returnValue(Promise.resolve(null));

      const mockAsset = jasmine.createSpyObj('Asset', ['getLayers']);
      mockAsset.getLayers.and.returnValue([
        Mocks.object('otherLayer'),
      ]);
      spyOn(item, 'getAsset_').and.returnValue(Promise.resolve(mockAsset));

      spyOn(item.downDisabledHook_, 'set');
      spyOn(item.upDisabledHook_, 'set');

      await item['updateLayerPosition_']();

      assert(item.downDisabledHook_.set).toNot.haveBeenCalled();
      assert(item.upDisabledHook_.set).toNot.haveBeenCalled();
    });
  });
});

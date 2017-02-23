import {assert, Matchers, TestBase} from '../test-base';
TestBase.setup();

import {Mocks} from 'external/gs_tools/src/mock';
import {TestDispose} from 'external/gs_tools/src/testing';

import {BaseLayer} from '../data/base-layer';
import {DataEvents} from '../data/data-events';

import {AbstractLayerEditor} from './abstract-layer-editor';


class TestLayerEditor extends AbstractLayerEditor<BaseLayer> {
  checkLayer_(): null {
    return null;
  }

  onLayerChange_(): void { }
}


describe('asset.AbstractLayerEditor', () => {
  let mockAssetCollection;
  let editor: AbstractLayerEditor<BaseLayer>;

  beforeEach(() => {
    mockAssetCollection = jasmine.createSpyObj('AssetCollection', ['get']);
    editor = new TestLayerEditor(mockAssetCollection, Mocks.object('ThemeService'));
    TestDispose.add(editor);
  });

  describe('disposeInternal', () => {
    it('should dispose the layer deregister', () => {
      const mockDeregister = jasmine.createSpyObj('Deregister', ['dispose']);
      editor['layerDeregister_'] = mockDeregister;
      editor.disposeInternal();
      assert(mockDeregister.dispose).to.haveBeenCalledWith();
    });

    it('should not throw error if there are no layer deregisters', () => {
      assert(() => {
        editor.disposeInternal();
      }).toNot.throw();
    });
  });

  describe('getAsset_', () => {
    it('should resolve with the correct asset', async (done: any) => {
      const assetId = 'assetId';
      spyOn(editor.assetIdHook_, 'get').and.returnValue(assetId);

      const projectId = 'projectId';
      spyOn(editor.projectIdHook_, 'get').and.returnValue(projectId);

      const asset = Mocks.object('asset');
      mockAssetCollection.get.and.returnValue(Promise.resolve(asset));

      assert(await editor['getAsset_']()).to.equal(asset);
      assert(mockAssetCollection.get).to.haveBeenCalledWith(projectId, assetId);
    });

    it('should resolve with null if asset ID cannot be found', async (done: any) => {
      spyOn(editor.assetIdHook_, 'get').and.returnValue(null);

      const projectId = 'projectId';
      spyOn(editor.projectIdHook_, 'get').and.returnValue(projectId);

      const asset = Mocks.object('asset');
      mockAssetCollection.get.and.returnValue(Promise.resolve(asset));

      assert(await editor['getAsset_']()).to.beNull();
    });

    it('should resolve with null if project ID cannot be found', async (done: any) => {
      const assetId = 'assetId';
      spyOn(editor.assetIdHook_, 'get').and.returnValue(assetId);

      spyOn(editor.projectIdHook_, 'get').and.returnValue(null);

      const asset = Mocks.object('asset');
      mockAssetCollection.get.and.returnValue(Promise.resolve(asset));

      assert(await editor['getAsset_']()).to.beNull();
    });
  });

  describe('getLayer_', () => {
    it('should resolve with the correct layer', async (done: any) => {
      const layerId = 'layerId';
      spyOn(editor.layerIdHook_, 'get').and.returnValue(layerId);

      const mockLayer = jasmine.createSpyObj('Layer', ['getId']);
      mockLayer.getId.and.returnValue(layerId);

      const mockAsset = jasmine.createSpyObj('Asset', ['getLayers']);
      mockAsset.getLayers.and.returnValue([mockLayer]);
      spyOn(editor, 'getAsset_').and.returnValue(Promise.resolve(mockAsset));

      const checkedLayer = Mocks.object('checkedLayer');
      spyOn(editor, 'checkLayer_').and.returnValue(checkedLayer);

      assert(await editor['getLayer_']()).to.equal(checkedLayer);
      assert(editor['checkLayer_']).to.haveBeenCalledWith(mockLayer);
    });

    it('should resolve with null if the layer cannot be found', async (done: any) => {
      const layerId = 'layerId';
      spyOn(editor.layerIdHook_, 'get').and.returnValue(layerId);

      const mockLayer = jasmine.createSpyObj('Layer', ['getId']);
      mockLayer.getId.and.returnValue('otherLayerId');

      const mockAsset = jasmine.createSpyObj('Asset', ['getLayers']);
      mockAsset.getLayers.and.returnValue([mockLayer]);
      spyOn(editor, 'getAsset_').and.returnValue(Promise.resolve(mockAsset));

      assert(await editor['getLayer_']()).to.beNull();
    });

    it('should resolve with null if the asset cannot be found', async (done: any) => {
      const layerId = 'layerId';
      spyOn(editor.layerIdHook_, 'get').and.returnValue(layerId);

      spyOn(editor, 'getAsset_').and.returnValue(Promise.resolve(null));

      assert(await editor['getLayer_']()).to.beNull();
    });

    it('should resolve with null if there are no layer IDs', async (done: any) => {
      spyOn(editor.layerIdHook_, 'get').and.returnValue(null);

      assert(await editor['getLayer_']()).to.beNull();
    });
  });

  describe('onLayerIdChange_', () => {
    it('should listen to changes to the new layer and dispose the old deregister',
        async (done: any) => {
          const mockOldDeregister = jasmine.createSpyObj('OldDeregister', ['dispose']);
          editor['layerDeregister_'] = mockOldDeregister;

          const mockDeregister = jasmine.createSpyObj('Deregister', ['dispose']);
          const mockLayer = jasmine.createSpyObj('Layer', ['on']);
          mockLayer.on.and.returnValue(mockDeregister);
          spyOn(editor, 'getLayer_').and.returnValue(Promise.resolve(mockLayer));

          const spyOnLayerChange = spyOn(editor, 'onLayerChange_');

          await editor['onLayerIdChange_']();

          assert(editor['onLayerChange_']).to.haveBeenCalledWith(mockLayer);

          spyOnLayerChange.calls.reset();
          assert(mockLayer.on).to
              .haveBeenCalledWith(DataEvents.CHANGED, Matchers.any(Function), editor);
          mockLayer.on.calls.argsFor(0)[1]();
          assert(editor['onLayerChange_']).to.haveBeenCalledWith(mockLayer);
          assert(editor['layerDeregister_']).to.equal(mockDeregister);
          assert(mockOldDeregister.dispose).to.haveBeenCalledWith();
        });

    it('should only dispose the old deregister if the layer cannot be found',
        async (done: any) => {
          const mockOldDeregister = jasmine.createSpyObj('OldDeregister', ['dispose']);
          editor['layerDeregister_'] = mockOldDeregister;

          spyOn(editor, 'getLayer_').and.returnValue(Promise.resolve(null));

          await editor['onLayerIdChange_']();

          assert(editor['layerDeregister_']).to.beNull();
          assert(mockOldDeregister.dispose).to.haveBeenCalledWith();
        });

    it('should not reject if there are no old deregisters',
        async (done: any) => {
          spyOn(editor, 'getLayer_').and.returnValue(Promise.resolve(null));

          await editor['onLayerIdChange_']();
        });
  });
});

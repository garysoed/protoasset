import {assert, Matchers, TestBase} from '../test-base';
TestBase.setup();

import {Mocks} from 'external/gs_tools/src/mock';
import {TestDispose} from 'external/gs_tools/src/testing';

import {DataEvents} from '../data/data-events';
import {ImageLayer} from '../data/image-layer';

import {ImageLayerEditor} from './image-layer-editor';


describe('namespace.ImageLayerEditor', () => {
  let mockAssetCollection;
  let editor: ImageLayerEditor;

  beforeEach(() => {
    mockAssetCollection = jasmine.createSpyObj('AssetCollection', ['get', 'update']);
    editor = new ImageLayerEditor(mockAssetCollection, Mocks.object('ThemeService'));
    TestDispose.add(editor);
  });

  describe('getAsset_', () => {
    it('should resolve with the correct asset', async (done: any) => {
      let assetId = 'assetId';
      spyOn(editor['assetIdHook_'], 'get').and.returnValue(assetId);

      let projectId = 'projectId';
      spyOn(editor['projectIdHook_'], 'get').and.returnValue(projectId);

      let asset = Mocks.object('asset');
      mockAssetCollection.get.and.returnValue(Promise.resolve(asset));

      assert(await editor['getAsset_']()).to.equal(asset);
      assert(mockAssetCollection.get).to.haveBeenCalledWith(projectId, assetId);
    });

    it('should resolve with null if asset ID cannot be found', async (done: any) => {
      spyOn(editor['assetIdHook_'], 'get').and.returnValue(null);

      let projectId = 'projectId';
      spyOn(editor['projectIdHook_'], 'get').and.returnValue(projectId);

      let asset = Mocks.object('asset');
      mockAssetCollection.get.and.returnValue(Promise.resolve(asset));

      assert(await editor['getAsset_']()).to.beNull();
    });

    it('should resolve with null if project ID cannot be found', async (done: any) => {
      let assetId = 'assetId';
      spyOn(editor['assetIdHook_'], 'get').and.returnValue(assetId);

      spyOn(editor['projectIdHook_'], 'get').and.returnValue(null);

      let asset = Mocks.object('asset');
      mockAssetCollection.get.and.returnValue(Promise.resolve(asset));

      assert(await editor['getAsset_']()).to.beNull();
    });
  });

  describe('getLayer_', () => {
    it('should resolve with the correct layer', async (done: any) => {
      let layerId = 'layerId';
      spyOn(editor['layerIdHook_'], 'get').and.returnValue(layerId);

      let mockLayer = jasmine.createSpyObj('Layer', ['getId']);
      mockLayer.getId.and.returnValue(layerId);
      Object.setPrototypeOf(mockLayer, ImageLayer.prototype);

      let mockAsset = jasmine.createSpyObj('Asset', ['getLayers']);
      mockAsset.getLayers.and.returnValue([mockLayer]);
      spyOn(editor, 'getAsset_').and.returnValue(Promise.resolve(mockAsset));

      assert(await editor['getLayer_']()).to.equal(mockLayer);
    });

    it('should resolve with null if the layer is not an ImageLayer', async (done: any) => {
      let layerId = 'layerId';
      spyOn(editor['layerIdHook_'], 'get').and.returnValue(layerId);

      let mockLayer = jasmine.createSpyObj('Layer', ['getId']);
      mockLayer.getId.and.returnValue(layerId);

      let mockAsset = jasmine.createSpyObj('Asset', ['getLayers']);
      mockAsset.getLayers.and.returnValue([mockLayer]);
      spyOn(editor, 'getAsset_').and.returnValue(Promise.resolve(mockAsset));

      assert(await editor['getLayer_']()).to.beNull();
    });

    it('should resolve with null if the layer cannot be found', async (done: any) => {
      let layerId = 'layerId';
      spyOn(editor['layerIdHook_'], 'get').and.returnValue(layerId);

      let mockLayer = jasmine.createSpyObj('Layer', ['getId']);
      mockLayer.getId.and.returnValue('otherLayerId');
      Object.setPrototypeOf(mockLayer, ImageLayer.prototype);

      let mockAsset = jasmine.createSpyObj('Asset', ['getLayers']);
      mockAsset.getLayers.and.returnValue([mockLayer]);
      spyOn(editor, 'getAsset_').and.returnValue(Promise.resolve(mockAsset));

      assert(await editor['getLayer_']()).to.beNull();
    });

    it('should resolve with null if the asset cannot be found', async (done: any) => {
      let layerId = 'layerId';
      spyOn(editor['layerIdHook_'], 'get').and.returnValue(layerId);

      spyOn(editor, 'getAsset_').and.returnValue(Promise.resolve(null));

      assert(await editor['getLayer_']()).to.beNull();
    });

    it('should resolve with null if there are no layer IDs', async (done: any) => {
      spyOn(editor['layerIdHook_'], 'get').and.returnValue(null);

      assert(await editor['getLayer_']()).to.beNull();
    });
  });

  describe('onLayerChange_', () => {
    it('should update the UI correctly', () => {
      let top = 12;
      let bottom = 34;
      let left = 56;
      let right = 78;
      let imageUrl = 'imageUrl';
      let mockLayer = jasmine.createSpyObj(
          'Layer',
          ['getBottom', 'getImageUrl', 'getLeft', 'getRight', 'getTop']);
      mockLayer.getBottom.and.returnValue(bottom);
      mockLayer.getImageUrl.and.returnValue(imageUrl);
      mockLayer.getLeft.and.returnValue(left);
      mockLayer.getRight.and.returnValue(right);
      mockLayer.getTop.and.returnValue(top);

      spyOn(editor['topHook_'], 'set');
      spyOn(editor['bottomHook_'], 'set');
      spyOn(editor['leftHook_'], 'set');
      spyOn(editor['rightHook_'], 'set');
      spyOn(editor['imageUrlHook_'], 'set');

      editor['onLayerChange_'](mockLayer);

      assert(editor['topHook_'].set).to.haveBeenCalledWith(top);
      assert(editor['bottomHook_'].set).to.haveBeenCalledWith(bottom);
      assert(editor['leftHook_'].set).to.haveBeenCalledWith(left);
      assert(editor['rightHook_'].set).to.haveBeenCalledWith(right);
      assert(editor['imageUrlHook_'].set).to.haveBeenCalledWith(imageUrl);
    });
  });

  describe('onLayerIdChange_', () => {
    it('should listen to changes to the new layer and dispose the old deregister',
        async (done: any) => {
          let mockOldDeregister = jasmine.createSpyObj('OldDeregister', ['dispose']);
          editor['layerDeregister_'] = mockOldDeregister;

          let mockDeregister = jasmine.createSpyObj('Deregister', ['dispose']);
          let mockLayer = jasmine.createSpyObj('Layer', ['on']);
          mockLayer.on.and.returnValue(mockDeregister);
          spyOn(editor, 'getLayer_').and.returnValue(Promise.resolve(mockLayer));

          let spyOnLayerChange = spyOn(editor, 'onLayerChange_');

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
          let mockOldDeregister = jasmine.createSpyObj('OldDeregister', ['dispose']);
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

  describe('onFieldChange_', () => {
    it('should update the layer and asset, and the image preview correctly', async (done: any) => {
      let bottom = 12;
      let imageUrl = 'imageUrl';
      let left = 34;
      let right = 56;
      let top = 78;

      spyOn(editor['bottomHook_'], 'get').and.returnValue(bottom);
      spyOn(editor['imageUrlHook_'], 'get').and.returnValue(imageUrl);
      spyOn(editor['leftHook_'], 'get').and.returnValue(left);
      spyOn(editor['rightHook_'], 'get').and.returnValue(right);
      spyOn(editor['topHook_'], 'get').and.returnValue(top);

      let mockLayer = jasmine.createSpyObj(
          'Layer',
          ['setBottom', 'setImageUrl', 'setLeft', 'setRight', 'setTop']);
      spyOn(editor, 'getLayer_').and.returnValue(Promise.resolve(mockLayer));

      let style = Mocks.object('style');
      spyOn(editor['imagePreviewStyleHook_'], 'get').and.returnValue(style);

      let asset = Mocks.object('asset');
      spyOn(editor, 'getAsset_').and.returnValue(Promise.resolve(asset));

      await editor['onFieldChange_']();
      assert(mockAssetCollection.update).to.haveBeenCalledWith(asset);
      assert(style.backgroundImage).to.equal(`url(${imageUrl})`);
      assert(mockLayer.setTop).to.haveBeenCalledWith(top);
      assert(mockLayer.setRight).to.haveBeenCalledWith(right);
      assert(mockLayer.setLeft).to.haveBeenCalledWith(left);
      assert(mockLayer.setImageUrl).to.haveBeenCalledWith(imageUrl);
      assert(mockLayer.setBottom).to.haveBeenCalledWith(bottom);
    });

    it('should skip updating the image preview if the style element cannot be found',
        async (done: any) => {
          let bottom = 12;
          let imageUrl = 'imageUrl';
          let left = 34;
          let right = 56;
          let top = 78;

          spyOn(editor['bottomHook_'], 'get').and.returnValue(bottom);
          spyOn(editor['imageUrlHook_'], 'get').and.returnValue(imageUrl);
          spyOn(editor['leftHook_'], 'get').and.returnValue(left);
          spyOn(editor['rightHook_'], 'get').and.returnValue(right);
          spyOn(editor['topHook_'], 'get').and.returnValue(top);

          let mockLayer = jasmine.createSpyObj(
              'Layer',
              ['setBottom', 'setImageUrl', 'setLeft', 'setRight', 'setTop']);
          spyOn(editor, 'getLayer_').and.returnValue(Promise.resolve(mockLayer));

          spyOn(editor['imagePreviewStyleHook_'], 'get').and.returnValue(null);

          let asset = Mocks.object('asset');
          spyOn(editor, 'getAsset_').and.returnValue(Promise.resolve(asset));

          await editor['onFieldChange_']();
          assert(mockAssetCollection.update).to.haveBeenCalledWith(asset);
          assert(mockLayer.setTop).to.haveBeenCalledWith(top);
          assert(mockLayer.setRight).to.haveBeenCalledWith(right);
          assert(mockLayer.setLeft).to.haveBeenCalledWith(left);
          assert(mockLayer.setImageUrl).to.haveBeenCalledWith(imageUrl);
          assert(mockLayer.setBottom).to.haveBeenCalledWith(bottom);
        });

    it('should do nothing if the asset cannot be found', async (done: any) => {
      let mockLayer = jasmine.createSpyObj(
          'Layer',
          ['setBottom', 'setImageUrl', 'setLeft', 'setRight', 'setTop']);
      spyOn(editor, 'getLayer_').and.returnValue(Promise.resolve(mockLayer));

      spyOn(editor, 'getAsset_').and.returnValue(Promise.resolve(null));

      await editor['onFieldChange_']();
      assert(mockAssetCollection.update).toNot.haveBeenCalledWith();
    });

    it('should do nothing if the layer cannot be found', async (done: any) => {
      spyOn(editor, 'getLayer_').and.returnValue(Promise.resolve(null));
      spyOn(editor, 'getAsset_').and.returnValue(Promise.resolve(null));

      await editor['onFieldChange_']();
      assert(mockAssetCollection.update).toNot.haveBeenCalledWith();
    });
  });

  describe('disposeInternal', () => {
    it('should dispose the layer deregister', () => {
      let mockDeregister = jasmine.createSpyObj('Deregister', ['dispose']);
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
});

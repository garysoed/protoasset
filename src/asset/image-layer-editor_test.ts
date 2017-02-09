import {assert, Matchers, TestBase} from '../test-base';
TestBase.setup();

import {Mocks} from 'external/gs_tools/src/mock';
import {TestDispose} from 'external/gs_tools/src/testing';

import {DataEvents} from '../data/data-events';
import {ImageLayer} from '../data/image-layer';

import {ImageLayerEditor} from './image-layer-editor';


describe('namespace.ImageLayerEditor', () => {
  let mockAssetCollection;
  let mockSampleDataService;
  let mockTemplateCompilerService;
  let editor: ImageLayerEditor;

  beforeEach(() => {
    mockAssetCollection = jasmine.createSpyObj('AssetCollection', ['get', 'update']);
    mockSampleDataService = jasmine.createSpyObj('SampleDataService', ['getRowData']);
    mockTemplateCompilerService = jasmine.createSpyObj('TemplateCompilerService', ['create']);
    editor = new ImageLayerEditor(
        mockAssetCollection,
        mockSampleDataService,
        mockTemplateCompilerService,
        Mocks.object('ThemeService'));
    TestDispose.add(editor);
  });

  describe('getAsset_', () => {
    it('should resolve with the correct asset', async (done: any) => {
      const assetId = 'assetId';
      spyOn(editor['assetIdHook_'], 'get').and.returnValue(assetId);

      const projectId = 'projectId';
      spyOn(editor['projectIdHook_'], 'get').and.returnValue(projectId);

      const asset = Mocks.object('asset');
      mockAssetCollection.get.and.returnValue(Promise.resolve(asset));

      assert(await editor['getAsset_']()).to.equal(asset);
      assert(mockAssetCollection.get).to.haveBeenCalledWith(projectId, assetId);
    });

    it('should resolve with null if asset ID cannot be found', async (done: any) => {
      spyOn(editor['assetIdHook_'], 'get').and.returnValue(null);

      const projectId = 'projectId';
      spyOn(editor['projectIdHook_'], 'get').and.returnValue(projectId);

      const asset = Mocks.object('asset');
      mockAssetCollection.get.and.returnValue(Promise.resolve(asset));

      assert(await editor['getAsset_']()).to.beNull();
    });

    it('should resolve with null if project ID cannot be found', async (done: any) => {
      const assetId = 'assetId';
      spyOn(editor['assetIdHook_'], 'get').and.returnValue(assetId);

      spyOn(editor['projectIdHook_'], 'get').and.returnValue(null);

      const asset = Mocks.object('asset');
      mockAssetCollection.get.and.returnValue(Promise.resolve(asset));

      assert(await editor['getAsset_']()).to.beNull();
    });
  });

  describe('getLayer_', () => {
    it('should resolve with the correct layer', async (done: any) => {
      const layerId = 'layerId';
      spyOn(editor['layerIdHook_'], 'get').and.returnValue(layerId);

      const mockLayer = jasmine.createSpyObj('Layer', ['getId']);
      mockLayer.getId.and.returnValue(layerId);
      Object.setPrototypeOf(mockLayer, ImageLayer.prototype);

      const mockAsset = jasmine.createSpyObj('Asset', ['getLayers']);
      mockAsset.getLayers.and.returnValue([mockLayer]);
      spyOn(editor, 'getAsset_').and.returnValue(Promise.resolve(mockAsset));

      assert(await editor['getLayer_']()).to.equal(mockLayer);
    });

    it('should resolve with null if the layer is not an ImageLayer', async (done: any) => {
      const layerId = 'layerId';
      spyOn(editor['layerIdHook_'], 'get').and.returnValue(layerId);

      const mockLayer = jasmine.createSpyObj('Layer', ['getId']);
      mockLayer.getId.and.returnValue(layerId);

      const mockAsset = jasmine.createSpyObj('Asset', ['getLayers']);
      mockAsset.getLayers.and.returnValue([mockLayer]);
      spyOn(editor, 'getAsset_').and.returnValue(Promise.resolve(mockAsset));

      assert(await editor['getLayer_']()).to.beNull();
    });

    it('should resolve with null if the layer cannot be found', async (done: any) => {
      const layerId = 'layerId';
      spyOn(editor['layerIdHook_'], 'get').and.returnValue(layerId);

      const mockLayer = jasmine.createSpyObj('Layer', ['getId']);
      mockLayer.getId.and.returnValue('otherLayerId');
      Object.setPrototypeOf(mockLayer, ImageLayer.prototype);

      const mockAsset = jasmine.createSpyObj('Asset', ['getLayers']);
      mockAsset.getLayers.and.returnValue([mockLayer]);
      spyOn(editor, 'getAsset_').and.returnValue(Promise.resolve(mockAsset));

      assert(await editor['getLayer_']()).to.beNull();
    });

    it('should resolve with null if the asset cannot be found', async (done: any) => {
      const layerId = 'layerId';
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
      const top = 12;
      const bottom = 34;
      const left = 56;
      const right = 78;
      const imageUrl = 'imageUrl';
      const mockLayer = jasmine.createSpyObj(
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

  describe('onFieldChange_', () => {
    it('should update the image preview correctly', async (done: any) => {
      const imageUrl = 'imageUrl';
      spyOn(editor['imageUrlHook_'], 'get').and.returnValue(imageUrl);

      const renderedImageUrl = 'renderedImageUrl';
      const mockHandleBarExecutor = jasmine.createSpy('HandleBarExecutor');
      mockHandleBarExecutor.and.returnValue(renderedImageUrl);
      const mockCompiler = jasmine.createSpyObj('Compiler', ['compile']);
      mockCompiler.compile.and.returnValue(mockHandleBarExecutor);
      mockTemplateCompilerService.create.and.returnValue(Promise.resolve(mockCompiler));

      const style = Mocks.object('style');
      spyOn(editor['imagePreviewStyleHook_'], 'get').and.returnValue(style);

      const asset = Mocks.object('asset');
      spyOn(editor, 'getAsset_').and.returnValue(Promise.resolve(asset));

      const rowData = Mocks.object('rowData');
      mockSampleDataService.getRowData.and.returnValue(Promise.resolve(rowData));

      await editor['onFieldChange_']();
      assert(style.backgroundImage).to.equal(`url(${renderedImageUrl})`);
      assert(mockCompiler.compile).to.haveBeenCalledWith(imageUrl);
      assert(mockTemplateCompilerService.create).to.haveBeenCalledWith(asset, rowData);
    });

    it('should skip updating the image preview if the style element cannot be found',
        async (done: any) => {
          const imageUrl = 'imageUrl';

          spyOn(editor['imageUrlHook_'], 'get').and.returnValue(imageUrl);
          spyOn(editor['imagePreviewStyleHook_'], 'get').and.returnValue(null);

          const asset = Mocks.object('asset');
          spyOn(editor, 'getAsset_').and.returnValue(Promise.resolve(asset));

          const rowData = Mocks.object('rowData');
          mockSampleDataService.getRowData.and.returnValue(Promise.resolve(rowData));

          await editor['onFieldChange_']();
        });

    it('should not reject if the asset cannot be found', async (done: any) => {
      spyOn(editor, 'getAsset_').and.returnValue(Promise.resolve(null));

      const rowData = Mocks.object('rowData');
      mockSampleDataService.getRowData.and.returnValue(Promise.resolve(rowData));

      await editor['onFieldChange_']();
    });

    it('should not reject if the row data cannot be found', async (done: any) => {
      const asset = Mocks.object('asset');
      spyOn(editor, 'getAsset_').and.returnValue(Promise.resolve(asset));
      mockSampleDataService.getRowData.and.returnValue(Promise.resolve(null));

      await editor['onFieldChange_']();
    });
  });

  describe('onSaveClick_', () => {
    it('should update the layer and save it', async (done: any) => {
      const bottom = 12;
      const imageUrl = 'imageUrl';
      const left = 34;
      const right = 56;
      const top = 78;

      spyOn(editor['bottomHook_'], 'get').and.returnValue(bottom);
      spyOn(editor['imageUrlHook_'], 'get').and.returnValue(imageUrl);
      spyOn(editor['leftHook_'], 'get').and.returnValue(left);
      spyOn(editor['rightHook_'], 'get').and.returnValue(right);
      spyOn(editor['topHook_'], 'get').and.returnValue(top);

      const mockLayer = jasmine.createSpyObj(
          'Layer',
          ['setBottom', 'setImageUrl', 'setLeft', 'setRight', 'setTop']);
      spyOn(editor, 'getLayer_').and.returnValue(Promise.resolve(mockLayer));

      const asset = Mocks.object('asset');
      spyOn(editor, 'getAsset_').and.returnValue(Promise.resolve(asset));

      await editor['onSaveClick_']();
      assert(mockAssetCollection.update).to.haveBeenCalledWith(asset);
      assert(mockLayer.setTop).to.haveBeenCalledWith(top);
      assert(mockLayer.setRight).to.haveBeenCalledWith(right);
      assert(mockLayer.setLeft).to.haveBeenCalledWith(left);
      assert(mockLayer.setImageUrl).to.haveBeenCalledWith(imageUrl);
      assert(mockLayer.setBottom).to.haveBeenCalledWith(bottom);
    });

    it('should do nothing if the layer cannot be found', async (done: any) => {
      spyOn(editor, 'getLayer_').and.returnValue(Promise.resolve(null));

      const asset = Mocks.object('asset');
      spyOn(editor, 'getAsset_').and.returnValue(Promise.resolve(asset));

      await editor['onSaveClick_']();
      assert(mockAssetCollection.update).toNot.haveBeenCalled();
    });

    it('should do nothing if the asset cannot be found', async (done: any) => {
      const layer = Mocks.object('layer');
      spyOn(editor, 'getLayer_').and.returnValue(Promise.resolve(layer));

      spyOn(editor, 'getAsset_').and.returnValue(Promise.resolve(null));

      await editor['onSaveClick_']();
      assert(mockAssetCollection.update).toNot.haveBeenCalled();
    });
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
});

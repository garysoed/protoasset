import { assert, TestBase } from '../test-base';
TestBase.setup();

import { Mocks } from 'external/gs_tools/src/mock';
import { TestDispose } from 'external/gs_tools/src/testing';

import { ImageLayerEditor } from '../asset/image-layer-editor';
import { SampleDataServiceEvent } from '../common/sample-data-service-event';
import { ImageLayer } from '../data/image-layer';


describe('asset.ImageLayerEditor', () => {
  let mockAssetCollection: any;
  let mockSampleDataService: any;
  let mockTemplateCompilerService: any;
  let editor: ImageLayerEditor;

  beforeEach(() => {
    mockAssetCollection = jasmine.createSpyObj('AssetCollection', ['get', 'update']);
    mockSampleDataService = jasmine.createSpyObj('SampleDataService', ['getRowData', 'on']);
    mockTemplateCompilerService = jasmine.createSpyObj('TemplateCompilerService', ['create']);
    editor = new ImageLayerEditor(
        mockAssetCollection,
        mockSampleDataService,
        mockTemplateCompilerService,
        jasmine.createSpyObj('ThemeService', ['applyTheme']));
    TestDispose.add(editor);
  });

  describe('checkLayer_', () => {
    it('should return the layer if it is an instance of ImageLayer', () => {
      const layer = Mocks.object('layer');
      Object.setPrototypeOf(layer, ImageLayer.prototype);
      assert(editor['checkLayer_'](layer)).to.be(layer);
    });

    it('should return null if the layer is not an ImageLayer', () => {
      const layer = Mocks.object('layer');
      assert(editor['checkLayer_'](layer)).to.beNull();
    });
  });

  describe('onCreated', () => {
    it('should listen to sample data row changed event', () => {
      const mockDisposable = jasmine.createSpyObj('Disposable', ['dispose']);
      spyOn(editor, 'listenTo').and.returnValue(mockDisposable);
      spyOn(editor, 'addDisposable').and.callThrough();
      editor.onCreated(Mocks.object('element'));
      assert(editor.listenTo).to.haveBeenCalledWith(
          mockSampleDataService,
          SampleDataServiceEvent.ROW_CHANGED,
          editor['onSampleDataRowChanged_']);
    });
  });

  describe('onDataChanged_', () => {
    it('should update the layer and save it', async () => {
      const imageUrl = 'imageUrl';

      spyOn(editor.imageUrlHook_, 'get').and.returnValue(imageUrl);

      const mockLayer = jasmine.createSpyObj('Layer', ['setImageUrl']);
      spyOn(editor, 'getLayer_').and.returnValue(Promise.resolve(mockLayer));

      const asset = Mocks.object('asset');
      spyOn(editor, 'getAsset_').and.returnValue(Promise.resolve(asset));

      await editor['onDataChanged_']();
      assert(mockAssetCollection.update).to.haveBeenCalledWith(asset);
      assert(mockLayer.setImageUrl).to.haveBeenCalledWith(imageUrl);
    });

    it('should do nothing if the layer cannot be found', async () => {
      spyOn(editor, 'getLayer_').and.returnValue(Promise.resolve(null));

      const asset = Mocks.object('asset');
      spyOn(editor, 'getAsset_').and.returnValue(Promise.resolve(asset));

      await editor['onDataChanged_']();
      assert(mockAssetCollection.update).toNot.haveBeenCalled();
    });

    it('should do nothing if the asset cannot be found', async () => {
      const layer = Mocks.object('layer');
      spyOn(editor, 'getLayer_').and.returnValue(Promise.resolve(layer));

      spyOn(editor, 'getAsset_').and.returnValue(Promise.resolve(null));

      await editor['onDataChanged_']();
      assert(mockAssetCollection.update).toNot.haveBeenCalled();
    });
  });

  describe('onFieldChange_', () => {
    it('should update the image preview correctly', async () => {
      const imageUrl = 'imageUrl';
      spyOn(editor.imageUrlHook_, 'get').and.returnValue(imageUrl);

      const renderedImageUrl = 'renderedImageUrl';
      const mockCompiler = jasmine.createSpyObj('Compiler', ['compile']);
      mockCompiler.compile.and.returnValue(renderedImageUrl);
      mockTemplateCompilerService.create.and.returnValue(Promise.resolve(mockCompiler));

      const style = Mocks.object('style');
      spyOn(editor.imagePreviewStyleHook_, 'get').and.returnValue(style);

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
        async () => {
          const imageUrl = 'imageUrl';

          spyOn(editor.imageUrlHook_, 'get').and.returnValue(imageUrl);
          spyOn(editor.imagePreviewStyleHook_, 'get').and.returnValue(null);

          const asset = Mocks.object('asset');
          spyOn(editor, 'getAsset_').and.returnValue(Promise.resolve(asset));

          const rowData = Mocks.object('rowData');
          mockSampleDataService.getRowData.and.returnValue(Promise.resolve(rowData));

          await editor['onFieldChange_']();
        });

    it('should not reject if the asset cannot be found', async () => {
      spyOn(editor, 'getAsset_').and.returnValue(Promise.resolve(null));

      const rowData = Mocks.object('rowData');
      mockSampleDataService.getRowData.and.returnValue(Promise.resolve(rowData));

      await editor['onFieldChange_']();
    });

    it('should not reject if the row data cannot be found', async () => {
      const asset = Mocks.object('asset');
      spyOn(editor, 'getAsset_').and.returnValue(Promise.resolve(asset));
      mockSampleDataService.getRowData.and.returnValue(Promise.resolve(null));

      await editor['onFieldChange_']();
    });
  });

  describe('onLayerChange_', () => {
    it('should update the UI correctly', () => {
      const imageUrl = 'imageUrl';
      const mockLayer = jasmine.createSpyObj('Layer', ['getImageUrl']);
      mockLayer.getImageUrl.and.returnValue(imageUrl);

      spyOn(editor.imageUrlHook_, 'set');

      editor['onLayerChange_'](mockLayer);

      assert(editor.imageUrlHook_.set).to.haveBeenCalledWith(imageUrl);
    });
  });

  describe('onSampleDataRowChanged_', () => {
    it('should call onFieldChange_', () => {
      spyOn(editor, 'onFieldChange_');
      editor['onSampleDataRowChanged_']();
      assert(editor.onFieldChange_).to.haveBeenCalledWith();
    });
  });
});

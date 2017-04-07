import { assert, TestBase } from '../test-base';
TestBase.setup();

import { Mocks } from 'external/gs_tools/src/mock';
import { TestDispose } from 'external/gs_tools/src/testing';

import { BaseLayerEditor } from './base-layer-editor';


describe('asset.BaseLayerEditor', () => {
  let mockAssetCollection;
  let editor: BaseLayerEditor;

  beforeEach(() => {
    mockAssetCollection = jasmine.createSpyObj('AssetCollection', ['get', 'update']);
    editor = new BaseLayerEditor(
        mockAssetCollection,
        Mocks.object('ThemeService'));
    TestDispose.add(editor);
  });

  describe('checkLayer_', () => {
    it('should return the given layer', () => {
      const layer = Mocks.object('layer');
      assert(editor['checkLayer_'](layer)).to.be(layer);
    });
  });

  describe('onDataChanged_', () => {
    it('should update the layer and save it', async () => {
      const bottom = 12;
      const left = 34;
      const right = 56;
      const top = 78;

      spyOn(editor.bottomHook_, 'get').and.returnValue(bottom);
      spyOn(editor.leftHook_, 'get').and.returnValue(left);
      spyOn(editor.rightHook_, 'get').and.returnValue(right);
      spyOn(editor.topHook_, 'get').and.returnValue(top);

      const mockLayer = jasmine.createSpyObj(
          'Layer',
          ['setBottom', 'setLeft', 'setRight', 'setTop']);
      spyOn(editor, 'getLayer_').and.returnValue(Promise.resolve(mockLayer));

      const asset = Mocks.object('asset');
      spyOn(editor, 'getAsset_').and.returnValue(Promise.resolve(asset));

      await editor['onDataChanged_']();
      assert(mockAssetCollection.update).to.haveBeenCalledWith(asset);
      assert(mockLayer.setTop).to.haveBeenCalledWith(top);
      assert(mockLayer.setRight).to.haveBeenCalledWith(right);
      assert(mockLayer.setLeft).to.haveBeenCalledWith(left);
      assert(mockLayer.setBottom).to.haveBeenCalledWith(bottom);
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

  describe('onLayerChange_', () => {
    it('should update the UI correctly', () => {
      const top = 12;
      const bottom = 34;
      const left = 56;
      const right = 78;
      const mockLayer = jasmine.createSpyObj(
          'Layer',
          ['getBottom', 'getLeft', 'getRight', 'getTop']);
      mockLayer.getBottom.and.returnValue(bottom);
      mockLayer.getLeft.and.returnValue(left);
      mockLayer.getRight.and.returnValue(right);
      mockLayer.getTop.and.returnValue(top);

      spyOn(editor.topHook_, 'set');
      spyOn(editor.bottomHook_, 'set');
      spyOn(editor.leftHook_, 'set');
      spyOn(editor.rightHook_, 'set');

      editor['onLayerChange_'](mockLayer);

      assert(editor.topHook_.set).to.haveBeenCalledWith(top);
      assert(editor.bottomHook_.set).to.haveBeenCalledWith(bottom);
      assert(editor.leftHook_.set).to.haveBeenCalledWith(left);
      assert(editor.rightHook_.set).to.haveBeenCalledWith(right);
    });
  });
});

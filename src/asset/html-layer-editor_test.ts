import { assert, TestBase } from '../test-base';
TestBase.setup();

import { Mocks } from 'external/gs_tools/src/mock';
import { TestDispose } from 'external/gs_tools/src/testing';

import { HtmlLayerEditor } from '../asset/html-layer-editor';
import { HtmlLayer } from '../data/html-layer';


describe('asset.HtmlLayerEditoror', () => {
  let mockAssetCollection: any;
  let editor: HtmlLayerEditor;

  beforeEach(() => {
    mockAssetCollection = jasmine.createSpyObj('AssetCollection', ['update']);
    editor = new HtmlLayerEditor(
        mockAssetCollection,
        Mocks.object('ThemeService'));
    TestDispose.add(editor);
  });

  describe('checkLayer_', () => {
    it('should return the layer if the layer is HtmlLayer', () => {
      const layer = Mocks.object('layer');
      Object.setPrototypeOf(layer, HtmlLayer.prototype);
      assert(editor['checkLayer_'](layer)).to.be(layer);
    });

    it('should return null if the layer is not HtmlLayer', () => {
      const layer = Mocks.object('layer');
      assert(editor['checkLayer_'](layer)).to.beNull();
    });
  });

  describe('onDataChanged_', () => {
    it('should update the layer correctly', async () => {
      const asset = Mocks.object('asset');
      spyOn(editor, 'getAsset_').and.returnValue(Promise.resolve(asset));

      const mockLayer = jasmine.createSpyObj('Layer', ['setCss', 'setHtml']);
      spyOn(editor, 'getLayer_').and.returnValue(Promise.resolve(mockLayer));

      const css = 'css';
      const html = 'html';
      spyOn(editor.cssValueHook_, 'get').and.returnValue(css);
      spyOn(editor.htmlValueHook_, 'get').and.returnValue(html);

      await editor['onDataChanged_']();
      assert(mockAssetCollection.update).to.haveBeenCalledWith(asset);
      assert(mockLayer.setHtml).to.haveBeenCalledWith(html);
      assert(mockLayer.setCss).to.haveBeenCalledWith(css);
    });

    it('should not update the layer if css and html are null', async () => {
      const asset = Mocks.object('asset');
      spyOn(editor, 'getAsset_').and.returnValue(Promise.resolve(asset));

      const mockLayer = jasmine.createSpyObj('Layer', ['setCss', 'setHtml']);
      spyOn(editor, 'getLayer_').and.returnValue(Promise.resolve(mockLayer));

      spyOn(editor.cssValueHook_, 'get').and.returnValue(null);
      spyOn(editor.htmlValueHook_, 'get').and.returnValue(null);

      await editor['onDataChanged_']();
      assert(mockAssetCollection.update).to.haveBeenCalledWith(asset);
      assert(mockLayer.setHtml).toNot.haveBeenCalled();
      assert(mockLayer.setCss).toNot.haveBeenCalled();
    });

    it('should do nothing if layer cannot be found', async () => {
      const asset = Mocks.object('asset');
      spyOn(editor, 'getAsset_').and.returnValue(Promise.resolve(asset));

      spyOn(editor, 'getLayer_').and.returnValue(Promise.resolve(null));

      spyOn(editor.cssValueHook_, 'get');
      spyOn(editor.htmlValueHook_, 'get');

      await editor['onDataChanged_']();
      assert(mockAssetCollection.update).toNot.haveBeenCalled();
    });

    it('should do nothing if asset cannot be found', async () => {
      spyOn(editor, 'getAsset_').and.returnValue(Promise.resolve(null));

      const mockLayer = jasmine.createSpyObj('Layer', ['setCss', 'setHtml']);
      spyOn(editor, 'getLayer_').and.returnValue(Promise.resolve(mockLayer));

      spyOn(editor.cssValueHook_, 'get');
      spyOn(editor.htmlValueHook_, 'get');

      await editor['onDataChanged_']();
      assert(mockAssetCollection.update).toNot.haveBeenCalled();
    });
  });

  describe('onLayerChange_', () => {
    it('should update the UI correctly', () => {
      const css = 'css';
      const html = 'html';
      const mockLayer = jasmine.createSpyObj('Layer', ['getCss', 'getHtml']);
      mockLayer.getCss.and.returnValue(css);
      mockLayer.getHtml.and.returnValue(html);
      spyOn(editor.cssValueHook_, 'set');
      spyOn(editor.htmlValueHook_, 'set');

      editor['onLayerChange_'](mockLayer);
      assert(editor.cssValueHook_.set).to.haveBeenCalledWith(css);
      assert(editor.htmlValueHook_.set).to.haveBeenCalledWith(html);
    });
  });
});

import {assert, TestBase} from '../test-base';
TestBase.setup();

import {Mocks} from 'external/gs_tools/src/mock';
import {TestDispose} from 'external/gs_tools/src/testing';

import {TextLayer} from '../data/text-layer';

import {TextLayerEditor} from './text-layer-editor';


describe('namespace.TextLayerEditor', () => {
  let editor: TextLayerEditor;

  beforeEach(() => {
    editor = new TextLayerEditor(
        Mocks.object('AssetCollection'),
        Mocks.object('ThemeService'));
    TestDispose.add(editor);
  });

  describe('checkLayer_', () => {
    it('should return the input layer if the layer is TextLayer', () => {
      const layer = Mocks.object('layer');
      Object.setPrototypeOf(layer, TextLayer.prototype);
      assert(editor['checkLayer_'](layer)).to.be(layer);
    });

    it('should return null if the input layer is not a TextLayer', () => {
      const layer = Mocks.object('layer');
      assert(editor['checkLayer_'](layer)).to.beNull();
    });
  });

  describe('onFieldsChanged_', () => {
    it('should update the layer correctly', async (done: any) => {
      const mockLayer = jasmine.createSpyObj(
          'Layer', ['setColor', 'setFontFamily', 'setFontUrl', 'setSize', 'setText']);
      spyOn(editor, 'getLayer_').and.returnValue(Promise.resolve(mockLayer));

      const color = 'color';
      spyOn(editor.colorHook_, 'get').and.returnValue(color);

      const fontFamily = 'fontFamily';
      spyOn(editor.fontFamilyHook_, 'get').and.returnValue(fontFamily);

      const fontUrl = 'fontUrl';
      spyOn(editor.fontUrlHook_, 'get').and.returnValue(fontUrl);

      const size = 'size';
      spyOn(editor.sizeHook_, 'get').and.returnValue(size);

      const text = 'text';
      spyOn(editor.textHook_, 'get').and.returnValue(text);

      await editor.onFieldsChanged_();
      assert(mockLayer.setText).to.haveBeenCalledWith(text);
      assert(mockLayer.setSize).to.haveBeenCalledWith(size);
      assert(mockLayer.setFontUrl).to.haveBeenCalledWith(fontUrl);
      assert(mockLayer.setFontFamily).to.haveBeenCalledWith(fontFamily);
      assert(mockLayer.setColor).to.haveBeenCalledWith(color);
    });

    it('should not update the size, font family, or color if they are null', async (done: any) => {
      const mockLayer = jasmine.createSpyObj(
          'Layer', ['setColor', 'setFontFamily', 'setFontUrl', 'setSize', 'setText']);
      spyOn(editor, 'getLayer_').and.returnValue(Promise.resolve(mockLayer));

      spyOn(editor.colorHook_, 'get').and.returnValue(null);
      spyOn(editor.fontFamilyHook_, 'get').and.returnValue(null);

      const fontUrl = 'fontUrl';
      spyOn(editor.fontUrlHook_, 'get').and.returnValue(fontUrl);

      spyOn(editor.sizeHook_, 'get').and.returnValue(null);

      const text = 'text';
      spyOn(editor.textHook_, 'get').and.returnValue(text);

      await editor.onFieldsChanged_();
      assert(mockLayer.setText).to.haveBeenCalledWith(text);
      assert(mockLayer.setSize).toNot.haveBeenCalled();
      assert(mockLayer.setFontUrl).to.haveBeenCalledWith(fontUrl);
      assert(mockLayer.setFontFamily).toNot.haveBeenCalled();
      assert(mockLayer.setColor).toNot.haveBeenCalled();
    });

    it('should not reject if there are no layers found', async (done: any) => {
      spyOn(editor, 'getLayer_').and.returnValue(Promise.resolve(null));

      await editor.onFieldsChanged_();
    });
  });

  describe('onLayerChange_', () => {
    it('should update the UI correctly', () => {
      const mockLayer = jasmine.createSpyObj(
          'Layer', ['getColor', 'getFontFamily', 'getFontUrl', 'getSize', 'getText']);
      const color = 'color';
      mockLayer.getColor.and.returnValue(color);

      const fontFamily = 'fontFamily';
      mockLayer.getFontFamily.and.returnValue(fontFamily);

      const fontUrl = 'fontUrl';
      mockLayer.getFontUrl.and.returnValue(fontUrl);

      const size = 'size';
      mockLayer.getSize.and.returnValue(size);

      const text = 'text';
      mockLayer.getText.and.returnValue(text);

      spyOn(editor.colorHook_, 'set');
      spyOn(editor.fontFamilyHook_, 'set');
      spyOn(editor.fontUrlHook_, 'set');
      spyOn(editor.sizeHook_, 'set');
      spyOn(editor.textHook_, 'set');

      editor['onLayerChange_'](mockLayer);
      assert(editor.colorHook_.set).to.haveBeenCalledWith(color);
      assert(editor.fontFamilyHook_.set).to.haveBeenCalledWith(fontFamily);
      assert(editor.fontUrlHook_.set).to.haveBeenCalledWith(fontUrl);
      assert(editor.sizeHook_.set).to.haveBeenCalledWith(size);
      assert(editor.textHook_.set).to.haveBeenCalledWith(text);
    });
  });
});

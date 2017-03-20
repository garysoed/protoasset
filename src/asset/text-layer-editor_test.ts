import { assert, TestBase } from '../test-base';
TestBase.setup();

import { Mocks } from 'external/gs_tools/src/mock';
import { TestDispose } from 'external/gs_tools/src/testing';

import { TextLayerEditor } from '../asset/text-layer-editor';
import { HorizontalAlign, TextLayer, VerticalAlign } from '../data/text-layer';


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
          'Layer',
          [
            'setColor',
            'setFontFamily',
            'setFontUrl',
            'setFontWeight',
            'setHorizontalAlign',
            'setSize',
            'setText',
            'setVerticalAlign',
          ]);
      spyOn(editor, 'getLayer_').and.returnValue(Promise.resolve(mockLayer));

      const color = 'color';
      spyOn(editor.colorHook_, 'get').and.returnValue(color);

      const fontFamily = 'fontFamily';
      spyOn(editor.fontFamilyHook_, 'get').and.returnValue(fontFamily);

      const fontWeight = 'fontWeight';
      spyOn(editor.fontWeightHook_, 'get').and.returnValue(fontWeight);

      const fontUrl = 'fontUrl';
      spyOn(editor.fontUrlHook_, 'get').and.returnValue(fontUrl);

      const horizontalAlign = HorizontalAlign.CENTER;
      spyOn(editor.horizontalAlignHook_, 'get').and.returnValue(horizontalAlign);

      const size = 'size';
      spyOn(editor.sizeHook_, 'get').and.returnValue(size);

      const text = 'text';
      spyOn(editor.textHook_, 'get').and.returnValue(text);

      const verticalAlign = VerticalAlign.BOTTOM;
      spyOn(editor.verticalAlignHook_, 'get').and.returnValue(verticalAlign);

      await editor.onFieldsChanged_();
      assert(mockLayer.setVerticalAlign).to.haveBeenCalledWith(verticalAlign);
      assert(mockLayer.setText).to.haveBeenCalledWith(text);
      assert(mockLayer.setSize).to.haveBeenCalledWith(size);
      assert(mockLayer.setHorizontalAlign).to.haveBeenCalledWith(horizontalAlign);
      assert(mockLayer.setFontUrl).to.haveBeenCalledWith(fontUrl);
      assert(mockLayer.setFontWeight).to.haveBeenCalledWith(fontWeight);
      assert(mockLayer.setFontFamily).to.haveBeenCalledWith(fontFamily);
      assert(mockLayer.setColor).to.haveBeenCalledWith(color);
    });

    it('should not update the size, font family, or color if they are null', async (done: any) => {
      const mockLayer = jasmine.createSpyObj(
          'Layer',
          [
            'setColor',
            'setFontFamily',
            'setFontUrl',
            'setFontWeight',
            'setHorizontalAlign',
            'setSize',
            'setText',
            'setVerticalAlign',
          ]);
      spyOn(editor, 'getLayer_').and.returnValue(Promise.resolve(mockLayer));

      spyOn(editor.colorHook_, 'get').and.returnValue(null);
      spyOn(editor.fontFamilyHook_, 'get').and.returnValue(null);
      spyOn(editor.fontWeightHook_, 'get').and.returnValue(null);

      const fontUrl = 'fontUrl';
      spyOn(editor.fontUrlHook_, 'get').and.returnValue(fontUrl);

      spyOn(editor.horizontalAlignHook_, 'get').and.returnValue(null);
      spyOn(editor.sizeHook_, 'get').and.returnValue(null);

      const text = 'text';
      spyOn(editor.textHook_, 'get').and.returnValue(text);

      spyOn(editor.verticalAlignHook_, 'get').and.returnValue(null);

      await editor.onFieldsChanged_();
      assert(mockLayer.setVerticalAlign).toNot.haveBeenCalled();
      assert(mockLayer.setText).to.haveBeenCalledWith(text);
      assert(mockLayer.setSize).toNot.haveBeenCalled();
      assert(mockLayer.setHorizontalAlign).toNot.haveBeenCalled();
      assert(mockLayer.setFontUrl).to.haveBeenCalledWith(fontUrl);
      assert(mockLayer.setFontWeight).toNot.haveBeenCalled();
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
          'Layer',
          [
            'getColor',
            'getFontFamily',
            'getFontUrl',
            'getFontWeight',
            'getHorizontalAlign',
            'getSize',
            'getText',
            'getVerticalAlign',
          ]);
      const color = 'color';
      mockLayer.getColor.and.returnValue(color);

      const fontFamily = 'fontFamily';
      mockLayer.getFontFamily.and.returnValue(fontFamily);

      const fontUrl = 'fontUrl';
      mockLayer.getFontUrl.and.returnValue(fontUrl);

      const fontWeight = 'fontWeight';
      mockLayer.getFontWeight.and.returnValue(fontWeight);

      const horizontalAlign = HorizontalAlign.LEFT;
      mockLayer.getHorizontalAlign.and.returnValue(horizontalAlign);

      const size = 'size';
      mockLayer.getSize.and.returnValue(size);

      const text = 'text';
      mockLayer.getText.and.returnValue(text);

      const verticalAlign = VerticalAlign.CENTER;
      mockLayer.getVerticalAlign.and.returnValue(verticalAlign);

      spyOn(editor.colorHook_, 'set');
      spyOn(editor.fontFamilyHook_, 'set');
      spyOn(editor.fontUrlHook_, 'set');
      spyOn(editor.fontWeightHook_, 'set');
      spyOn(editor.horizontalAlignHook_, 'set');
      spyOn(editor.sizeHook_, 'set');
      spyOn(editor.textHook_, 'set');
      spyOn(editor.verticalAlignHook_, 'set');

      editor['onLayerChange_'](mockLayer);
      assert(editor.colorHook_.set).to.haveBeenCalledWith(color);
      assert(editor.fontFamilyHook_.set).to.haveBeenCalledWith(fontFamily);
      assert(editor.fontUrlHook_.set).to.haveBeenCalledWith(fontUrl);
      assert(editor.fontWeightHook_.set).to.haveBeenCalledWith(fontWeight);
      assert(editor.horizontalAlignHook_.set).to.haveBeenCalledWith(horizontalAlign);
      assert(editor.sizeHook_.set).to.haveBeenCalledWith(size);
      assert(editor.textHook_.set).to.haveBeenCalledWith(text);
      assert(editor.verticalAlignHook_.set).to.haveBeenCalledWith(verticalAlign);
    });
  });
});

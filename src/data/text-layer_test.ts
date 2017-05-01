import { assert, Matchers, TestBase } from '../test-base';
TestBase.setup();

import { TestDispose } from 'external/gs_tools/src/testing';

import { BaseLayer } from '../data/base-layer';
import { DataEvents } from '../data/data-events';
import { HorizontalAlign, TextLayer, VerticalAlign } from '../data/text-layer';


describe('data.TextLayer', () => {
  let layer: TextLayer;

  beforeEach(() => {
    layer = new TextLayer('id', 'name');
    TestDispose.add(layer);
  });

  describe('asHtml', () => {
    it('should return the correct HTML and CSS components', () => {
      const color = 'color';
      const fontUrl = 'fontUrl';
      const fontFamily = 'fontFamily';
      const fontSize = 'fontSize';
      const fontWeight = 'fontWeight';
      layer.setColor(color);
      layer.setFontUrl(fontUrl);
      layer.setFontFamily(fontFamily);
      layer.setFontWeight(fontWeight);
      layer.setSize(fontSize);

      const alignItems = 'alignItems';
      spyOn(layer, 'getAlignItems_').and.returnValue(alignItems);

      const boxStyle = 'boxStyle';
      spyOn(layer, 'getBoxStyles_').and.returnValue([boxStyle]);

      const div = 'div';
      spyOn(layer, 'createDiv_').and.returnValue(div);

      const {css, html} = layer.asHtml();
      assert(css).to.equal(`@import url('${fontUrl}');`);

      assert(html).to.equal(div);
      assert(layer['createDiv_']).to.haveBeenCalledWith([
        boxStyle,
        `align-items: ${alignItems};`,
        `color: ${color};`,
        `display: flex;`,
        `font-family: ${fontFamily};`,
        `font-size: ${fontSize};`,
        `line-height: initial;`,
        `font-weight: ${fontWeight};`,
      ]);
    });

    it('should not include the font weight or url if they are null', () => {
      const color = 'color';
      const fontFamily = 'fontFamily';
      const fontSize = 'fontSize';
      layer.setColor(color);
      layer.setFontFamily(fontFamily);
      layer.setSize(fontSize);

      const alignItems = 'alignItems';
      spyOn(layer, 'getAlignItems_').and.returnValue(alignItems);

      const boxStyle = 'boxStyle';
      spyOn(layer, 'getBoxStyles_').and.returnValue([boxStyle]);

      const div = 'div';
      spyOn(layer, 'createDiv_').and.returnValue(div);

      const {css, html} = layer.asHtml();
      assert(css).to.equal(``);

      assert(html).to.equal(div);
      assert(layer['createDiv_']).to.haveBeenCalledWith([
        boxStyle,
        `align-items: ${alignItems};`,
        `color: ${color};`,
        `display: flex;`,
        `font-family: ${fontFamily};`,
        `font-size: ${fontSize};`,
        `line-height: initial;`,
      ]);
    });
  });

  describe('asInactiveNormalPreviewHtml_', () => {
    it('should return the correct HTML and CSS components', () => {
      const color = 'color';
      const fontUrl = 'fontUrl';
      const fontFamily = 'fontFamily';
      const fontSize = 'fontSize';
      const fontWeight = 'fontWeight';
      layer.setColor(color);
      layer.setFontUrl(fontUrl);
      layer.setFontFamily(fontFamily);
      layer.setFontWeight(fontWeight);
      layer.setSize(fontSize);

      const alignItems = 'alignItems';
      spyOn(layer, 'getAlignItems_').and.returnValue(alignItems);

      const boxStyle = 'boxStyle';
      spyOn(layer, 'getBoxStyles_').and.returnValue([boxStyle]);

      const div = 'div';
      spyOn(layer, 'createDiv_').and.returnValue(div);

      const {css, html} = layer['asInactiveNormalPreviewHtml_']();
      assert(css).to.equal(`@import url('${fontUrl}');`);

      assert(html).to.equal(div);
      assert(layer['createDiv_']).to.haveBeenCalledWith([
        boxStyle,
        `align-items: ${alignItems};`,
        `color: ${color};`,
        `display: flex;`,
        `font-family: ${fontFamily};`,
        `font-size: ${fontSize};`,
        `filter: grayscale(50%);`,
        `line-height: initial;`,
        `opacity: .5;`,
        `font-weight: ${fontWeight};`,
      ]);
    });

    it('should exclude the font-weight and font-url if they are null', () => {
      const color = 'color';
      const fontFamily = 'fontFamily';
      const fontSize = 'fontSize';
      layer.setColor(color);
      layer.setFontFamily(fontFamily);
      layer.setSize(fontSize);

      const alignItems = 'alignItems';
      spyOn(layer, 'getAlignItems_').and.returnValue(alignItems);

      const boxStyle = 'boxStyle';
      spyOn(layer, 'getBoxStyles_').and.returnValue([boxStyle]);

      const div = 'div';
      spyOn(layer, 'createDiv_').and.returnValue(div);

      const {css, html} = layer['asInactiveNormalPreviewHtml_']();
      assert(css).to.equal('');

      assert(html).to.equal(div);
      assert(layer['createDiv_']).to.haveBeenCalledWith([
        boxStyle,
        `align-items: ${alignItems};`,
        `color: ${color};`,
        `display: flex;`,
        `font-family: ${fontFamily};`,
        `font-size: ${fontSize};`,
        `filter: grayscale(50%);`,
        `line-height: initial;`,
        `opacity: .5;`,
      ]);
    });
  });

  describe('copy', () => {
    it('should create the correct copy', () => {
      const id = 'id';
      const layerName = 'layerName';
      layer.setName(layerName);
      spyOn(layer, 'copyInto_');

      const copy = layer.copy(id);
      TestDispose.add(copy);
      assert(copy).to.beAnInstanceOf(TextLayer);
      assert(copy.getId()).to.equal(id);
      assert(copy.getName()).to.equal(layerName);
      assert(layer['copyInto_']).to.haveBeenCalledWith(copy);
    });
  });

  describe('copyInto_', () => {
    it('should set the fields correctly', () => {
      const color = 'color';
      const fontFamily = 'fontFamily';
      const fontUrl = 'fontUrl';
      const fontWeight = 'fontWeight';
      const horizontalAlign = HorizontalAlign.JUSTIFY;
      const size = 'size';
      const text = 'text';
      const verticalAlign = VerticalAlign.TOP;
      layer.setColor(color);
      layer.setFontFamily(fontFamily);
      layer.setFontUrl(fontUrl);
      layer.setFontWeight(fontWeight);
      layer.setHorizontalAlign(horizontalAlign);
      layer.setSize(size);
      layer.setText(text);
      layer.setVerticalAlign(verticalAlign);

      const mockTargetLayer = jasmine.createSpyObj('TargetLayer', [
        'setColor',
        'setFontFamily',
        'setFontUrl',
        'setFontWeight',
        'setHorizontalAlign',
        'setSize',
        'setText',
        'setVerticalAlign',
      ]);

      spyOn(BaseLayer.prototype, 'copyInto_');

      layer['copyInto_'](mockTargetLayer);
      assert(mockTargetLayer.setColor).to.haveBeenCalledWith(color);
      assert(mockTargetLayer.setFontFamily).to.haveBeenCalledWith(fontFamily);
      assert(mockTargetLayer.setFontUrl).to.haveBeenCalledWith(fontUrl);
      assert(mockTargetLayer.setFontWeight).to.haveBeenCalledWith(fontWeight);
      assert(mockTargetLayer.setHorizontalAlign).to.haveBeenCalledWith(horizontalAlign);
      assert(mockTargetLayer.setSize).to.haveBeenCalledWith(size);
      assert(mockTargetLayer.setText).to.haveBeenCalledWith(text);
      assert(mockTargetLayer.setVerticalAlign).to.haveBeenCalledWith(verticalAlign);
      assert(BaseLayer.prototype['copyInto_']).to.haveBeenCalledWith(mockTargetLayer);
    });
  });

  describe('createDiv_', () => {
    it('should apply the correct parent and child styles and return the correct div', () => {
      const parentStyle1 = 'parentStyle1';
      const parentStyle2 = 'parentStyle2';

      const text = 'text';
      layer['text_'] = text;

      const childStyles = [
        `text-align: left;`,
        `width: 100%;`,
      ];
      const childHtml = `<div style="${childStyles.join('')}">${text}</div>`;
      assert(layer['createDiv_']([parentStyle1, parentStyle2])).to
          .equal(`<div style="${parentStyle1}${parentStyle2}">${childHtml}</div>`);
    });
  });

  describe('getAlignItems_', () => {
    it('should return the correct align-items value', () => {
      layer['verticalAlign_'] = VerticalAlign.TOP;
      assert(layer['getAlignItems_']()).to.equal('flex-start');
    });
  });

  describe('setBottom', () => {
    it('should dispatch the CHANGED event', () => {
      spyOn(layer, 'dispatch').and.callFake((event: any, callback: Function) => {
        callback();
      });

      const bottom = 123;
      layer.setBottom(bottom);

      assert(layer.dispatch).to
          .haveBeenCalledWith(DataEvents.CHANGED, Matchers.any(Function) as () => void);
      assert(layer.getBottom()).to.equal(bottom);
    });

    it('should not dispatch the CHANGED event if the bottom does not change', () => {
      spyOn(layer, 'dispatch').and.callFake((event: any, callback: Function) => {
        callback();
      });

      const bottom = 123;
      layer['bottom_'] = bottom;

      layer.setBottom(bottom);

      assert(layer.dispatch).toNot.haveBeenCalled();
      assert(layer.getBottom()).to.equal(bottom);
    });
  });

  describe('setColor', () => {
    it('should dispatch the CHANGED event', () => {
      spyOn(layer, 'dispatch').and.callFake((event: any, callback: Function) => {
        callback();
      });

      const color = 'color';
      layer.setColor(color);

      assert(layer.dispatch).to
          .haveBeenCalledWith(DataEvents.CHANGED, Matchers.any(Function) as () => void);
      assert(layer.getColor()).to.equal(color);
    });

    it('should not dispatch the CHANGED event if the color does not change', () => {
      spyOn(layer, 'dispatch').and.callFake((event: any, callback: Function) => {
        callback();
      });

      const color = 'color';
      layer['color_'] = color;

      layer.setColor(color);

      assert(layer.dispatch).toNot.haveBeenCalled();
      assert(layer.getColor()).to.equal(color);
    });
  });

  describe('setFontFamily', () => {
    it('should dispatch the CHANGED event', () => {
      spyOn(layer, 'dispatch').and.callFake((event: any, callback: Function) => {
        callback();
      });

      const fontFamily = 'fontFamily';
      layer.setFontFamily(fontFamily);

      assert(layer.dispatch).to
          .haveBeenCalledWith(DataEvents.CHANGED, Matchers.any(Function) as () => void);
      assert(layer.getFontFamily()).to.equal(fontFamily);
    });

    it('should not dispatch the CHANGED event if the fontFamily does not change', () => {
      spyOn(layer, 'dispatch').and.callFake((event: any, callback: Function) => {
        callback();
      });

      const fontFamily = 'fontFamily';
      layer['fontFamily_'] = fontFamily;

      layer.setFontFamily(fontFamily);

      assert(layer.dispatch).toNot.haveBeenCalled();
      assert(layer.getFontFamily()).to.equal(fontFamily);
    });
  });

  describe('setFontUrl', () => {
    it('should dispatch the CHANGED event', () => {
      spyOn(layer, 'dispatch').and.callFake((event: any, callback: Function) => {
        callback();
      });

      const fontUrl = 'fontUrl';
      layer.setFontUrl(fontUrl);

      assert(layer.dispatch).to
          .haveBeenCalledWith(DataEvents.CHANGED, Matchers.any(Function) as () => void);
      assert(layer.getFontUrl()).to.equal(fontUrl);
    });

    it('should not dispatch the CHANGED event if the fontUrl does not change', () => {
      spyOn(layer, 'dispatch').and.callFake((event: any, callback: Function) => {
        callback();
      });

      const fontUrl = 'fontUrl';
      layer['fontUrl_'] = fontUrl;

      layer.setFontUrl(fontUrl);

      assert(layer.dispatch).toNot.haveBeenCalled();
      assert(layer.getFontUrl()).to.equal(fontUrl);
    });
  });

  describe('setFontWeight', () => {
    it('should dispatch the CHANGED event', () => {
      spyOn(layer, 'dispatch').and.callFake((event: any, callback: Function) => {
        callback();
      });

      const fontWeight = 'fontWeight';
      layer.setFontWeight(fontWeight);

      assert(layer.dispatch).to
          .haveBeenCalledWith(DataEvents.CHANGED, Matchers.any(Function) as () => void);
      assert(layer.getFontWeight()).to.equal(fontWeight);
    });

    it('should not dispatch the CHANGED event if the fontUrl does not change', () => {
      spyOn(layer, 'dispatch').and.callFake((event: any, callback: Function) => {
        callback();
      });

      const fontWeight = 'fontWeight';
      layer['fontWeight_'] = fontWeight;

      layer.setFontWeight(fontWeight);

      assert(layer.dispatch).toNot.haveBeenCalled();
      assert(layer.getFontWeight()).to.equal(fontWeight);
    });
  });

  describe('setHorizontalAlign', () => {
    it('should dispatch the CHANGED event', () => {
      spyOn(layer, 'dispatch').and.callFake((event: any, callback: Function) => {
        callback();
      });

      const horizontalAlign = HorizontalAlign.JUSTIFY;
      layer.setHorizontalAlign(horizontalAlign);

      assert(layer.dispatch).to
          .haveBeenCalledWith(DataEvents.CHANGED, Matchers.any(Function) as () => void);
      assert(layer.getHorizontalAlign()).to.equal(horizontalAlign);
    });

    it('should not dispatch the CHANGED event if the fontUrl does not change', () => {
      spyOn(layer, 'dispatch').and.callFake((event: any, callback: Function) => {
        callback();
      });

      const horizontalAlign = HorizontalAlign.LEFT;
      layer['horizontalAlign_'] = horizontalAlign;

      layer.setHorizontalAlign(horizontalAlign);

      assert(layer.dispatch).toNot.haveBeenCalled();
      assert(layer.getHorizontalAlign()).to.equal(horizontalAlign);
    });
  });

  describe('setLeft', () => {
    it('should dispatch the CHANGED event', () => {
      spyOn(layer, 'dispatch').and.callFake((event: any, callback: Function) => {
        callback();
      });

      const left = 123;
      layer.setLeft(left);

      assert(layer.dispatch).to
          .haveBeenCalledWith(DataEvents.CHANGED, Matchers.any(Function) as () => void);
      assert(layer.getLeft()).to.equal(left);
    });

    it('should not dispatch the CHANGED event if the left does not change', () => {
      spyOn(layer, 'dispatch').and.callFake((event: any, callback: Function) => {
        callback();
      });

      const left = 123;
      layer['left_'] = left;

      layer.setLeft(left);

      assert(layer.dispatch).toNot.haveBeenCalled();
      assert(layer.getLeft()).to.equal(left);
    });
  });

  describe('setRight', () => {
    it('should dispatch the CHANGED event', () => {
      spyOn(layer, 'dispatch').and.callFake((event: any, callback: Function) => {
        callback();
      });

      const right = 123;
      layer.setRight(right);

      assert(layer.dispatch).to
          .haveBeenCalledWith(DataEvents.CHANGED, Matchers.any(Function) as () => void);
      assert(layer.getRight()).to.equal(right);
    });

    it('should not dispatch the CHANGED event if the right does not change', () => {
      spyOn(layer, 'dispatch').and.callFake((event: any, callback: Function) => {
        callback();
      });

      const right = 123;
      layer['right_'] = right;

      layer.setRight(right);

      assert(layer.dispatch).toNot.haveBeenCalled();
      assert(layer.getRight()).to.equal(right);
    });
  });

  describe('setSize', () => {
    it('should dispatch the CHANGED event', () => {
      spyOn(layer, 'dispatch').and.callFake((event: any, callback: Function) => {
        callback();
      });

      const size = 'size';
      layer.setSize(size);

      assert(layer.dispatch).to
          .haveBeenCalledWith(DataEvents.CHANGED, Matchers.any(Function) as () => void);
      assert(layer.getSize()).to.equal(size);
    });

    it('should not dispatch the CHANGED event if the size does not change', () => {
      spyOn(layer, 'dispatch').and.callFake((event: any, callback: Function) => {
        callback();
      });

      const size = 'size';
      layer['size_'] = size;

      layer.setSize(size);

      assert(layer.dispatch).toNot.haveBeenCalled();
      assert(layer.getSize()).to.equal(size);
    });
  });

  describe('setText', () => {
    it('should dispatch the CHANGED event', () => {
      spyOn(layer, 'dispatch').and.callFake((event: any, callback: Function) => {
        callback();
      });

      const text = 'text';
      layer.setText(text);

      assert(layer.dispatch).to
          .haveBeenCalledWith(DataEvents.CHANGED, Matchers.any(Function) as () => void);
      assert(layer.getText()).to.equal(text);
    });

    it('should not dispatch the CHANGED event if the text does not change', () => {
      spyOn(layer, 'dispatch').and.callFake((event: any, callback: Function) => {
        callback();
      });

      const text = 'text';
      layer['text_'] = text;

      layer.setText(text);

      assert(layer.dispatch).toNot.haveBeenCalled();
      assert(layer.getText()).to.equal(text);
    });
  });

  describe('setTop', () => {
    it('should dispatch the CHANGED event', () => {
      spyOn(layer, 'dispatch').and.callFake((event: any, callback: Function) => {
        callback();
      });

      const top = 123;
      layer.setTop(top);

      assert(layer.dispatch).to
          .haveBeenCalledWith(DataEvents.CHANGED, Matchers.any(Function) as () => void);
      assert(layer.getTop()).to.equal(top);
    });

    it('should not dispatch the CHANGED event if the top does not change', () => {
      spyOn(layer, 'dispatch').and.callFake((event: any, callback: Function) => {
        callback();
      });

      const top = 123;
      layer['top_'] = top;

      layer.setTop(top);

      assert(layer.dispatch).toNot.haveBeenCalled();
      assert(layer.getTop()).to.equal(top);
    });
  });

  describe('setVerticalAlign', () => {
    it('should dispatch the CHANGED event', () => {
      spyOn(layer, 'dispatch').and.callFake((event: any, callback: Function) => {
        callback();
      });

      const verticalAlign = VerticalAlign.CENTER;
      layer.setVerticalAlign(verticalAlign);

      assert(layer.dispatch).to
          .haveBeenCalledWith(DataEvents.CHANGED, Matchers.any(Function) as () => void);
      assert(layer.getVerticalAlign()).to.equal(verticalAlign);
    });

    it('should not dispatch the CHANGED event if the fontUrl does not change', () => {
      spyOn(layer, 'dispatch').and.callFake((event: any, callback: Function) => {
        callback();
      });

      const verticalAlign = VerticalAlign.BOTTOM;
      layer['verticalAlign_'] = verticalAlign;

      layer.setVerticalAlign(verticalAlign);

      assert(layer.dispatch).toNot.haveBeenCalled();
      assert(layer.getVerticalAlign()).to.equal(verticalAlign);
    });
  });
});

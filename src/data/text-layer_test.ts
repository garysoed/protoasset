import {assert, Matchers, TestBase} from '../test-base';
TestBase.setup();

import {TestDispose} from 'external/gs_tools/src/testing';

import {DataEvents} from './data-events';
import {TextLayer} from './text-layer';


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
      const text = 'text';
      layer.setColor(color);
      layer.setFontUrl(fontUrl);
      layer.setFontFamily(fontFamily);
      layer.setSize(fontSize);
      layer.setText(text);

      const boxStyle = 'boxStyle';
      spyOn(layer, 'getBoxStyles_').and.returnValue([boxStyle]);

      const {css, html} = layer.asHtml();
      assert(css).to.equal(`@import url('${fontUrl}');`);

      const styles = [
        boxStyle,
        `color: ${color};`,
        `font-family: ${fontFamily};`,
        `font-size: ${fontSize};`,
      ];
      assert(html).to.equal(`<div style="${styles.join('')}">${text}</div>`);
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
          .haveBeenCalledWith(DataEvents.CHANGED, <() => void> Matchers.any(Function));
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
          .haveBeenCalledWith(DataEvents.CHANGED, <() => void> Matchers.any(Function));
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
          .haveBeenCalledWith(DataEvents.CHANGED, <() => void> Matchers.any(Function));
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
          .haveBeenCalledWith(DataEvents.CHANGED, <() => void> Matchers.any(Function));
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

  describe('setLeft', () => {
    it('should dispatch the CHANGED event', () => {
      spyOn(layer, 'dispatch').and.callFake((event: any, callback: Function) => {
        callback();
      });

      const left = 123;
      layer.setLeft(left);

      assert(layer.dispatch).to
          .haveBeenCalledWith(DataEvents.CHANGED, <() => void> Matchers.any(Function));
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
          .haveBeenCalledWith(DataEvents.CHANGED, <() => void> Matchers.any(Function));
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
          .haveBeenCalledWith(DataEvents.CHANGED, <() => void> Matchers.any(Function));
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
          .haveBeenCalledWith(DataEvents.CHANGED, <() => void> Matchers.any(Function));
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
          .haveBeenCalledWith(DataEvents.CHANGED, <() => void> Matchers.any(Function));
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
});

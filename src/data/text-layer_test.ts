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
      let fontUrl = 'fontUrl';
      let bottom = 12;
      let left = 34;
      let right = 56;
      let top = 78;
      let fontFamily = 'fontFamily';
      let text = 'text';
      layer.setFontUrl(fontUrl);
      layer.setBottom(bottom);
      layer.setLeft(left);
      layer.setRight(right);
      layer.setTop(top);
      layer.setFontFamily(fontFamily);
      layer.setText(text);

      let {css, html} = layer.asHtml();
      assert(css).to.equal(`@import '${fontUrl}';`);

      let styles = [
        `bottom: ${bottom}px;`,
        `left: ${left}px;`,
        `right: ${right}px;`,
        `top: ${top}px;`,
        `font-family: ${fontFamily};`,
      ];
      assert(html).to.equal(`<div style="${styles.join('')}">${text}</div>`);
    });

    it('should not include the bounding box or font import if not specified', () => {
      let fontFamily = 'fontFamily';
      let text = 'text';
      layer.setFontFamily(fontFamily);
      layer.setText(text);

      let {css, html} = layer.asHtml();
      assert(css).to.equal('');

      let styles = [
        `font-family: ${fontFamily};`,
      ];
      assert(html).to.equal(`<div style="${styles.join('')}">${text}</div>`);
    });
  });

  describe('setBottom', () => {
    it('should dispatch the CHANGED event', () => {
      spyOn(layer, 'dispatch').and.callFake((event: any, callback: Function) => {
        callback();
      });

      let bottom = 123;
      layer.setBottom(bottom);

      assert(layer.dispatch).to
          .haveBeenCalledWith(DataEvents.CHANGED, <() => void> Matchers.any(Function));
      assert(layer.getBottom()).to.equal(bottom);
    });

    it('should not dispatch the CHANGED event if the bottom does not change', () => {
      spyOn(layer, 'dispatch').and.callFake((event: any, callback: Function) => {
        callback();
      });

      let bottom = 123;
      layer['bottom_'] = bottom;

      layer.setBottom(bottom);

      assert(layer.dispatch).toNot.haveBeenCalled();
      assert(layer.getBottom()).to.equal(bottom);
    });
  });

  describe('setFontFamily', () => {
    it('should dispatch the CHANGED event', () => {
      spyOn(layer, 'dispatch').and.callFake((event: any, callback: Function) => {
        callback();
      });

      let fontFamily = 'fontFamily';
      layer.setFontFamily(fontFamily);

      assert(layer.dispatch).to
          .haveBeenCalledWith(DataEvents.CHANGED, <() => void> Matchers.any(Function));
      assert(layer.getFontFamily()).to.equal(fontFamily);
    });

    it('should not dispatch the CHANGED event if the fontFamily does not change', () => {
      spyOn(layer, 'dispatch').and.callFake((event: any, callback: Function) => {
        callback();
      });

      let fontFamily = 'fontFamily';
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

      let fontUrl = 'fontUrl';
      layer.setFontUrl(fontUrl);

      assert(layer.dispatch).to
          .haveBeenCalledWith(DataEvents.CHANGED, <() => void> Matchers.any(Function));
      assert(layer.getFontUrl()).to.equal(fontUrl);
    });

    it('should not dispatch the CHANGED event if the fontUrl does not change', () => {
      spyOn(layer, 'dispatch').and.callFake((event: any, callback: Function) => {
        callback();
      });

      let fontUrl = 'fontUrl';
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

      let left = 123;
      layer.setLeft(left);

      assert(layer.dispatch).to
          .haveBeenCalledWith(DataEvents.CHANGED, <() => void> Matchers.any(Function));
      assert(layer.getLeft()).to.equal(left);
    });

    it('should not dispatch the CHANGED event if the left does not change', () => {
      spyOn(layer, 'dispatch').and.callFake((event: any, callback: Function) => {
        callback();
      });

      let left = 123;
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

      let right = 123;
      layer.setRight(right);

      assert(layer.dispatch).to
          .haveBeenCalledWith(DataEvents.CHANGED, <() => void> Matchers.any(Function));
      assert(layer.getRight()).to.equal(right);
    });

    it('should not dispatch the CHANGED event if the right does not change', () => {
      spyOn(layer, 'dispatch').and.callFake((event: any, callback: Function) => {
        callback();
      });

      let right = 123;
      layer['right_'] = right;

      layer.setRight(right);

      assert(layer.dispatch).toNot.haveBeenCalled();
      assert(layer.getRight()).to.equal(right);
    });
  });

  describe('setText', () => {
    it('should dispatch the CHANGED event', () => {
      spyOn(layer, 'dispatch').and.callFake((event: any, callback: Function) => {
        callback();
      });

      let text = 'text';
      layer.setText(text);

      assert(layer.dispatch).to
          .haveBeenCalledWith(DataEvents.CHANGED, <() => void> Matchers.any(Function));
      assert(layer.getText()).to.equal(text);
    });

    it('should not dispatch the CHANGED event if the text does not change', () => {
      spyOn(layer, 'dispatch').and.callFake((event: any, callback: Function) => {
        callback();
      });

      let text = 'text';
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

      let top = 123;
      layer.setTop(top);

      assert(layer.dispatch).to
          .haveBeenCalledWith(DataEvents.CHANGED, <() => void> Matchers.any(Function));
      assert(layer.getTop()).to.equal(top);
    });

    it('should not dispatch the CHANGED event if the top does not change', () => {
      spyOn(layer, 'dispatch').and.callFake((event: any, callback: Function) => {
        callback();
      });

      let top = 123;
      layer['top_'] = top;

      layer.setTop(top);

      assert(layer.dispatch).toNot.haveBeenCalled();
      assert(layer.getTop()).to.equal(top);
    });
  });
});

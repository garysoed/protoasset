import {assert, Matchers, TestBase} from '../test-base';
TestBase.setup();

import {TestDispose} from 'external/gs_tools/src/testing';

import {DataEvents} from './data-events';
import {ImageLayer} from './image-layer';


describe('data.ImageLayer', () => {
  let layer: ImageLayer;

  beforeEach(() => {
    layer = new ImageLayer('id', 'name');
    TestDispose.add(layer);
  });

  describe('asHtml', () => {
    it('should return the correct CSS and HTML components', () => {
      let top = 12;
      let right = 34;
      let bottom = 56;
      let left = 78;
      let imageUrl = 'imageUrl';
      layer.setTop(top);
      layer.setRight(right);
      layer.setBottom(bottom);
      layer.setLeft(left);
      layer.setImageUrl(imageUrl);

      let {css, html} = layer.asHtml();
      assert(css).to.equal('');

      let expectedStyles = [
        `bottom: ${bottom}px;`,
        `left: ${left}px;`,
        `right: ${right}px;`,
        `top: ${top}px;`,
        `background: url('${imageUrl});`,
        `background-size: contain;`,
      ];
      assert(html).to.equal(`<div style="${expectedStyles.join('')}"></div>`);
    });

    it('should not include the bounding box if not specified', () => {
      let imageUrl = 'imageUrl';
      layer.setImageUrl(imageUrl);

      let {css, html} = layer.asHtml();
      assert(css).to.equal('');

      let expectedStyles = [
        `background: url('${imageUrl});`,
        `background-size: contain;`,
      ];
      assert(html).to.equal(`<div style="${expectedStyles.join('')}"></div>`);
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

  describe('setImageUrl', () => {
    it('should dispatch the CHANGED event', () => {
      spyOn(layer, 'dispatch').and.callFake((event: any, callback: Function) => {
        callback();
      });

      let imageUrl = 'imageUrl';
      layer.setImageUrl(imageUrl);

      assert(layer.dispatch).to
          .haveBeenCalledWith(DataEvents.CHANGED, <() => void> Matchers.any(Function));
      assert(layer.getImageUrl()).to.equal(imageUrl);
    });

    it('should not dispatch the CHANGED event if the imageUrl does not change', () => {
      spyOn(layer, 'dispatch').and.callFake((event: any, callback: Function) => {
        callback();
      });

      let imageUrl = 'imageUrl';
      layer['imageUrl_'] = imageUrl;

      layer.setImageUrl(imageUrl);

      assert(layer.dispatch).toNot.haveBeenCalled();
      assert(layer.getImageUrl()).to.equal(imageUrl);
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

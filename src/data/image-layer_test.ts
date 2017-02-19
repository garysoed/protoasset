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

  describe('asActiveBoundaryPreviewHtml_', () => {
    it('should return the correct CSS and HTML components', () => {
      const boxStyle1 = 'boxStyle1';
      const boxStyle2 = 'boxStyle2';
      spyOn(layer, 'getBoxStyles_').and.returnValue([boxStyle1, boxStyle2]);

      const html = 'html';
      spyOn(layer, 'createDiv_').and.returnValue(html);
      assert(layer['asActiveBoundaryPreviewHtml_']()).to.equal({
        css: '',
        html,
      });
      assert(layer['createDiv_']).to.haveBeenCalledWith([
        boxStyle1,
        boxStyle2,
        `background-color: var(--gsColorPassiveBG);`,
      ]);
    });
  });

  describe('asHtml', () => {
    it('should return the correct CSS and HTML components', () => {
      const top = 12;
      const right = 34;
      const bottom = 56;
      const left = 78;
      const imageUrl = 'imageUrl';
      layer.setTop(top);
      layer.setRight(right);
      layer.setBottom(bottom);
      layer.setLeft(left);
      layer.setImageUrl(imageUrl);

      const {css, html} = layer.asHtml();
      assert(css).to.equal('');

      const expectedStyles = [
        `bottom: ${bottom}px;`,
        `left: ${left}px;`,
        `right: ${right}px;`,
        `top: ${top}px;`,
        `background: url('${imageUrl}');`,
        `background-repeat: no-repeat;`,
        `background-size: contain;`,
        `position: absolute;`,
      ];
      assert(html).to.equal(`<div style="${expectedStyles.join('')}"></div>`);
    });
  });

  describe('asInactiveNormalPreviewHtml_', () => {
    it('should return the correct CSS and HTML components', () => {
      const boxStyle1 = 'boxStyle1';
      const boxStyle2 = 'boxStyle2';
      spyOn(layer, 'getBoxStyles_').and.returnValue([boxStyle1, boxStyle2]);

      const imageUrl = 'imageUrl';
      layer['imageUrl_'] = imageUrl;

      const html = 'html';
      spyOn(layer, 'createDiv_').and.returnValue(html);

      assert(layer['asInactiveNormalPreviewHtml_']()).to.equal({
        css: '',
        html,
      });
      assert(layer['createDiv_']).to.haveBeenCalledWith(Matchers.arrayContaining([
        boxStyle1,
        boxStyle2,
        `background: url('${imageUrl}');`,
      ]));
    });
  });

  describe('createDiv_', () => {
    it('should return the correct div', () => {
      const style1 = 'style1';
      const style2 = 'style2';
      assert(layer['createDiv_']([style1, style2])).to
          .equal(Matchers.stringMatching(new RegExp(`style="${style1}${style2}"`)));
    });
  });

  describe('getBoxStyles_', () => {
    it('should return the correct array of styles', () => {
      const bottom = 12;
      const left = 34;
      const right = 56;
      const top = 78;
      layer['bottom_'] = bottom;
      layer['left_'] = left;
      layer['right_'] = right;
      layer['top_'] = top;
      assert(layer['getBoxStyles_']()).to.equal([
        `bottom: ${bottom}px;`,
        `left: ${left}px;`,
        `right: ${right}px;`,
        `top: ${top}px;`,
      ]);
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

  describe('setImageUrl', () => {
    it('should dispatch the CHANGED event', () => {
      spyOn(layer, 'dispatch').and.callFake((event: any, callback: Function) => {
        callback();
      });

      const imageUrl = 'imageUrl';
      layer.setImageUrl(imageUrl);

      assert(layer.dispatch).to
          .haveBeenCalledWith(DataEvents.CHANGED, <() => void> Matchers.any(Function));
      assert(layer.getImageUrl()).to.equal(imageUrl);
    });

    it('should not dispatch the CHANGED event if the imageUrl does not change', () => {
      spyOn(layer, 'dispatch').and.callFake((event: any, callback: Function) => {
        callback();
      });

      const imageUrl = 'imageUrl';
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

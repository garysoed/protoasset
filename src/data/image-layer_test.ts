import { assert, Matchers, TestBase } from '../test-base';
TestBase.setup();

import { TestDispose } from 'external/gs_tools/src/testing';

import { DataEvents } from '../data/data-events';
import { ImageLayer } from '../data/image-layer';
import { BaseLayer } from 'src/data/base-layer';


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
        `background-color: var(--gsThemeNormal);`,
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
        `position: absolute;`,
        `background: url('${imageUrl}');`,
        `background-repeat: no-repeat;`,
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

  describe('copy', () => {
    it('should create the correct copy', () => {
      const id = 'id';
      const layerName = 'layerName';
      layer.setName(layerName);
      spyOn(layer, 'copyInto_');

      const copy = layer.copy(id);
      TestDispose.add(copy);
      assert(copy).to.beAnInstanceOf(ImageLayer);
      assert(copy.getId()).to.equal(id);
      assert(copy.getName()).to.equal(layerName);
      assert(layer['copyInto_']).to.haveBeenCalledWith(copy);
    });
  });

  describe('copyInto_', () => {
    it('should set the fields correctly', () => {
      const mockTargetLayer = jasmine.createSpyObj('TargetLayer', ['setImageUrl']);
      const imageUrl = 'imageUrl';
      layer.setImageUrl(imageUrl);
      spyOn(BaseLayer.prototype, 'copyInto_');

      layer['copyInto_'](mockTargetLayer);
      assert(mockTargetLayer.setImageUrl).to.haveBeenCalledWith(imageUrl);
      assert(BaseLayer.prototype['copyInto_']).to.haveBeenCalledWith(mockTargetLayer);
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
        `position: absolute;`,
      ]);
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
});

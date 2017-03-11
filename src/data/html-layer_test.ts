import { assert, Matchers, TestBase } from '../test-base';
TestBase.setup();

import { Mocks } from 'external/gs_tools/src/mock';
import { TestDispose } from 'external/gs_tools/src/testing';

import { BaseLayer } from '../data/base-layer';
import { DataEvents } from '../data/data-events';
import { HtmlLayer } from '../data/html-layer';


describe('data.HtmlLayer', () => {
  let layer: HtmlLayer;

  beforeEach(() => {
    layer = new HtmlLayer('id', 'name');
    TestDispose.add(layer);
  });

  describe('asHtml', () => {
    it('should return the correct CSS and HTML components', () => {
      const cssContent = 'cssContent';
      const htmlContent = 'htmlContent';
      layer.setCss(cssContent);
      layer.setHtml(htmlContent);

      const boxStyles = 'boxStyles';
      spyOn(layer, 'getBoxStyles_').and.returnValue([boxStyles]);

      const {css, html} = layer.asHtml();
      assert(css).to.equal(cssContent);
      assert(html).to.equal(`<div style="${boxStyles}">${htmlContent}</div>`);
    });
  });

  describe('asInactiveNormalPreviewHtml_', () => {
    it('should return the correct CSS and HTML components', () => {
      const boxStyles = 'boxStyles';
      spyOn(layer, 'getBoxStyles_').and.returnValue([boxStyles]);

      const styles = [
        boxStyles,
        'filter: grayscale(50%);',
        'opacity: .5;',
      ];

      const cssContent = 'cssContent';
      const htmlContent = 'htmlContent';
      layer.setCss(cssContent);
      layer.setHtml(htmlContent);

      const {css, html} = layer['asInactiveNormalPreviewHtml_']();
      assert(css).to.equal(cssContent);
      assert(html).to.equal(`<div style="${styles.join('')}">${htmlContent}</div>`);
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
      assert(copy).to.beAnInstanceOf(HtmlLayer);
      assert(copy.getId()).to.equal(id);
      assert(copy.getName()).to.equal(layerName);
      assert(layer['copyInto_']).to.haveBeenCalledWith(copy);
    });
  });

  describe('copyInto_', () => {
    it('should copy the correct properties', () => {
      const mockTargetLayer = jasmine.createSpyObj('TargetLayer', ['setCss', 'setHtml']);
      const css = 'css';
      layer.setCss(css);

      const html = 'html';
      layer.setHtml(html);

      spyOn(BaseLayer.prototype, 'copyInto_');

      layer['copyInto_'](mockTargetLayer);
      assert(mockTargetLayer.setHtml).to.haveBeenCalledWith(html);
      assert(mockTargetLayer.setCss).to.haveBeenCalledWith(css);
      assert(BaseLayer.prototype['copyInto_']).to.haveBeenCalledWith(mockTargetLayer);
    });
  });

  describe('setCss', () => {
    it('should dispatch the CHANGED event', () => {
      spyOn(layer, 'dispatch').and.callFake((event: any, callback: Function) => {
        callback();
      });

      const css = 'css';
      layer.setCss(css);

      assert(layer.dispatch).to
          .haveBeenCalledWith(DataEvents.CHANGED, <() => void> Matchers.any(Function));
      assert(layer.getCss()).to.equal(css);
    });

    it('should not dispatch the CHANGED event if the css does not change', () => {
      spyOn(layer, 'dispatch').and.callFake((event: any, callback: Function) => {
        callback();
      });

      const css = 'css';
      layer['css_'] = css;

      layer.setCss(css);

      assert(layer.dispatch).toNot.haveBeenCalled();
      assert(layer.getCss()).to.equal(css);
    });
  });

  describe('setHtml', () => {
    it('should dispatch the CHANGED event', () => {
      spyOn(layer, 'dispatch').and.callFake((event: any, callback: Function) => {
        callback();
      });

      const html = 'html';
      layer.setHtml(html);

      assert(layer.dispatch).to
          .haveBeenCalledWith(DataEvents.CHANGED, <() => void> Matchers.any(Function));
      assert(layer.getHtml()).to.equal(html);
    });

    it('should not dispatch the CHANGED event if the html does not change', () => {
      spyOn(layer, 'dispatch').and.callFake((event: any, callback: Function) => {
        callback();
      });

      const html = 'html';
      layer['html_'] = html;

      layer.setHtml(html);

      assert(layer.dispatch).toNot.haveBeenCalled();
      assert(layer.getHtml()).to.equal(html);
    });
  });
});

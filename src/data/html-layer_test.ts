import {assert, Matchers, TestBase} from '../test-base';
TestBase.setup();

import {Mocks} from 'external/gs_tools/src/mock';
import {TestDispose} from 'external/gs_tools/src/testing';

import {DataEvents} from './data-events';
import {HtmlLayer} from './html-layer';


describe('data.HtmlLayer', () => {
  let layer: HtmlLayer;

  beforeEach(() => {
    layer = new HtmlLayer('id', 'name');
    TestDispose.add(layer);
  });

  describe('asActiveBoundaryPreviewHtml_', () => {
    it('should return the correct CSS and HTML components', () => {
      const html = Mocks.object('html');
      spyOn(layer, 'asHtml').and.returnValue(html);
      assert(layer['asActiveBoundaryPreviewHtml_']()).to.equal(html);
    });
  });

  describe('asHtml', () => {
    it('should return the correct CSS and HTML components', () => {
      const css = 'css';
      const html = 'html';
      layer.setCss(css);
      layer.setHtml(html);

      assert(layer.asHtml()).to.equal({css, html});
    });
  });

  describe('asInactiveNormalPreviewHtml_', () => {
    it('should return the correct CSS and HTML components', () => {
      const html = Mocks.object('html');
      spyOn(layer, 'asHtml').and.returnValue(html);
      assert(layer['asInactiveNormalPreviewHtml_']()).to.equal(html);
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

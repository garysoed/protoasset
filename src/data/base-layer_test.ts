import {assert, Matchers, TestBase} from '../test-base';
TestBase.setup();

import {Mocks} from 'external/gs_tools/src/mock';
import {TestDispose} from 'external/gs_tools/src/testing';

import {BaseLayer} from './base-layer';
import {DataEvents} from './data-events';
import {LayerPreviewMode} from './layer-preview-mode';


class TestLayer extends BaseLayer {
  asActiveBoundaryPreviewHtml_(): {css: string, html: string} {
    return {css: '', html: ''};
  }

  asHtml(): {css: string, html: string} {
    return {css: '', html: ''};
  }

  asInactiveNormalPreviewHtml_(): {css: string, html: string} {
    return {css: '', html: ''};
  }
}

describe('data.BaseLayer', () => {
  let layer: BaseLayer;

  beforeEach(() => {
    layer = new TestLayer('id', 'name', Mocks.object('layerType'));
    TestDispose.add(layer);
  });

  describe('asPreviewHtml', () => {
    it('should return the correct components when the mode is NORMAL and layer is active', () => {
      const html = Mocks.object('html');
      spyOn(layer, 'asHtml').and.returnValue(html);
      assert(layer.asPreviewHtml(LayerPreviewMode.NORMAL, true)).to.equal(html);
    });

    it('should return the correct components when the mode is NORMAL and layer is inactive',
        () => {
          const html = Mocks.object('html');
          spyOn(layer, 'asInactiveNormalPreviewHtml_').and.returnValue(html);
          assert(layer.asPreviewHtml(LayerPreviewMode.NORMAL, false)).to.equal(html);
        });

    it('should return the correct components when the mode is BOUNDARY and layer is active',
        () => {
          const html = Mocks.object('html');
          spyOn(layer, 'asActiveBoundaryPreviewHtml_').and.returnValue(html);
          assert(layer.asPreviewHtml(LayerPreviewMode.BOUNDARY, true)).to.equal(html);
        });

    it('should return the correct components when the mode is BOUNDARY and layer is inactive',
        () => {
          const html = Mocks.object('html');
          spyOn(layer, 'asInactiveNormalPreviewHtml_').and.returnValue(html);
          assert(layer.asPreviewHtml(LayerPreviewMode.BOUNDARY, false)).to.equal(html);
        });

    it('should return the correct components when the mode is FULL', () => {
      const html = Mocks.object('html');
      spyOn(layer, 'asHtml').and.returnValue(html);
      assert(layer.asPreviewHtml(LayerPreviewMode.FULL, true)).to.equal(html);
    });
  });

  describe('setName', () => {
    it('should dispatch the CHANGED event', () => {
      spyOn(layer, 'dispatch').and.callFake((event: any, callback: Function) => {
        callback();
      });

      let name = 'name';
      layer['name_'] = 'otherName';
      layer.setName(name);

      assert(layer.dispatch).to
          .haveBeenCalledWith(DataEvents.CHANGED, <() => void> Matchers.any(Function));
      assert(layer.getName()).to.equal(name);
    });

    it('should not dispatch the CHANGED event if the name does not change', () => {
      spyOn(layer, 'dispatch').and.callFake((event: any, callback: Function) => {
        callback();
      });

      let name = 'name';
      layer['name_'] = name;

      layer.setName(name);

      assert(layer.dispatch).toNot.haveBeenCalled();
      assert(layer.getName()).to.equal(name);
    });
  });
});


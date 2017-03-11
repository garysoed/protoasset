import { assert, Matchers, TestBase } from '../test-base';
TestBase.setup();

import { Mocks } from 'external/gs_tools/src/mock';
import { TestDispose } from 'external/gs_tools/src/testing';

import { BaseLayer } from '../data/base-layer';
import { DataEvents } from '../data/data-events';
import { LayerPreviewMode } from '../data/layer-preview-mode';


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

  describe('copyInto_', () => {
    it('should copy the current data to the target layer', () => {
      const mockTarget =
          jasmine.createSpyObj('Target', ['setBottom', 'setLeft', 'setRight', 'setTop']);
      const bottom = 12;
      const left = 34;
      const right = 56;
      const top = 78;
      layer.setBottom(bottom);
      layer.setLeft(left);
      layer.setRight(right);
      layer.setTop(top);

      layer['copyInto_'](mockTarget);
      assert(mockTarget.setBottom).to.haveBeenCalledWith(bottom);
      assert(mockTarget.setLeft).to.haveBeenCalledWith(left);
      assert(mockTarget.setRight).to.haveBeenCalledWith(right);
      assert(mockTarget.setTop).to.haveBeenCalledWith(top);
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


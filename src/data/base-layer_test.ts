import {assert, Matchers, TestBase} from '../test-base';
TestBase.setup();

import {TestDispose} from 'external/gs_tools/src/testing';

import {BaseLayer} from './base-layer';
import {DataEvents} from './data-events';


class TestLayer extends BaseLayer {
  asHtml(): {css: string, html: string} {
    return {css: '', html: ''};
  }
}

describe('data.BaseLayer', () => {
  let layer: BaseLayer;

  beforeEach(() => {
    layer = new TestLayer('name');
    TestDispose.add(layer);
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


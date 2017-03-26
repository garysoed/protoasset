import { assert, Matchers, TestBase } from '../test-base';
TestBase.setup();

import { Mocks } from 'external/gs_tools/src/mock';
import { TestDispose } from 'external/gs_tools/src/testing';

import { Asset, AssetType } from '../data/asset';
import { DataEvents } from '../data/data-events';


describe('data.Asset', () => {
  let asset: Asset;

  beforeEach(() => {
    asset = new Asset('id', 'projectId');
    TestDispose.add(asset);
  });

  describe('deleteHelper', () => {
    it('should delete the helper and dispatch the changed event', () => {
      const helperId = 'helperId';
      const helper = Mocks.object('helper');
      asset['helpers_'] = {[helperId]: helper};
      spyOn(asset, 'dispatch').and.callFake((event: any, callback: Function) => {
        callback();
      });

      asset.deleteHelper(helperId);

      assert(asset.dispatch).to
          .haveBeenCalledWith(DataEvents.CHANGED, <() => void> Matchers.any(Function));
      assert(asset.getAllHelpers()).to.equal([]);
    });

    it('should not dispatch the changed event if the helper does not exist', () => {
      spyOn(asset, 'dispatch').and.callFake((event: any, callback: Function) => {
        callback();
      });

      asset.deleteHelper('helperId');

      assert(asset.dispatch).toNot.haveBeenCalled();
      assert(asset.getAllHelpers()).to.equal([]);
    });
  });

  describe('getAllHelpers', () => {
    it('should return the correct helpers', () => {
      const helperId1 = 'helperId1';
      const helperId2 = 'helperId2';
      const helperId3 = 'helperId3';
      const helper1 = jasmine.createSpyObj('helper1', ['dispose']);
      const helper2 = jasmine.createSpyObj('helper2', ['dispose']);
      const helper3 = jasmine.createSpyObj('helper3', ['dispose']);
      asset['helpers_'] = {
        [helperId1]: helper1,
        [helperId2]: helper2,
        [helperId3]: helper3,
      };
      assert(asset.getAllHelpers()).to.equal([helper1, helper2, helper3]);
    });
  });

  describe('getHelper', () => {
    it('should return the correct helper', () => {
      const helperId = 'helperId';
      const helper = jasmine.createSpyObj('helper', ['dispose']);
      asset['helpers_'] = {
        [helperId]: helper,
      };
      assert(asset.getHelper(helperId)).to.equal(helper);
    });

    it('should return null if the helper does not exist', () => {
      const helperId = 'helperId';
      const helper = jasmine.createSpyObj('helper', ['dispose']);
      asset['helpers_'] = {
        [helperId]: helper,
      };
      assert(asset.getHelper('otherHelperId')).to.beNull();
    });
  });

  describe('getLayerIds', () => {
    it('should return the correct IDs', () => {
      const id1 = 'id1';
      const mockLayer1 = jasmine.createSpyObj('Layer1', ['dispose', 'getId']);
      mockLayer1.getId.and.returnValue(id1);

      const id2 = 'id2';
      const mockLayer2 = jasmine.createSpyObj('Layer2', ['dispose', 'getId']);
      mockLayer2.getId.and.returnValue(id2);
      asset.setLayers([mockLayer1, mockLayer2]);
      assert(asset.getLayerIds()).to.equal([id1, id2]);
    });
  });

  describe('insertLayer', () => {
    it('should move the layer to the correct, higher position', () => {
      spyOn(asset, 'dispatch').and.callFake((event: any, callback: Function) => {
        callback();
      });

      const layer1 = jasmine.createSpyObj('layer1', ['dispose']);
      const layer2 = jasmine.createSpyObj('layer2', ['dispose']);
      const layer = jasmine.createSpyObj('layer', ['dispose']);

      asset['layers_'] = [layer1, layer, layer2];

      asset.insertLayer(layer, 2);

      assert(asset.dispatch).to
          .haveBeenCalledWith(DataEvents.CHANGED, <() => void> Matchers.any(Function));
      assert(asset.getLayers()).to.equal([layer1, layer2, layer]);
    });

    it('should move the layer to the correct, lower position', () => {
      spyOn(asset, 'dispatch').and.callFake((event: any, callback: Function) => {
        callback();
      });

      const layer1 = jasmine.createSpyObj('layer1', ['dispose']);
      const layer2 = jasmine.createSpyObj('layer2', ['dispose']);
      const layer = jasmine.createSpyObj('layer', ['dispose']);

      asset['layers_'] = [layer1, layer, layer2];

      asset.insertLayer(layer, 0);

      assert(asset.dispatch).to
          .haveBeenCalledWith(DataEvents.CHANGED, <() => void> Matchers.any(Function));
      assert(asset.getLayers()).to.equal([layer, layer1, layer2]);
    });

    it('should insert the layer correctly if it does not exist', () => {
      spyOn(asset, 'dispatch').and.callFake((event: any, callback: Function) => {
        callback();
      });

      const layer1 = jasmine.createSpyObj('layer1', ['dispose']);
      const layer2 = jasmine.createSpyObj('layer2', ['dispose']);
      const layer = jasmine.createSpyObj('layer', ['dispose']);

      asset['layers_'] = [layer1, layer2];

      asset.insertLayer(layer, 1);

      assert(asset.dispatch).to
          .haveBeenCalledWith(DataEvents.CHANGED, <() => void> Matchers.any(Function));
      assert(asset.getLayers()).to.equal([layer1, layer, layer2]);
    });

    it('should do nothing if the layer is already at the correct position', () => {
      spyOn(asset, 'dispatch').and.callFake((event: any, callback: Function) => {
        callback();
      });

      const layer1 = jasmine.createSpyObj('layer1', ['dispose']);
      const layer2 = jasmine.createSpyObj('layer2', ['dispose']);
      const layer = jasmine.createSpyObj('layer', ['dispose']);

      asset['layers_'] = [layer1, layer, layer2];

      asset.insertLayer(layer, 1);

      assert(asset.dispatch).toNot.haveBeenCalled();
      assert(asset.getLayers()).to.equal([layer1, layer, layer2]);
    });
  });

  describe('removeLayer', () => {
    it('should remove the layer correctly', () => {
      spyOn(asset, 'dispatch').and.callFake((event: any, callback: Function) => {
        callback();
      });

      const layer1 = jasmine.createSpyObj('layer1', ['dispose']);
      const layer2 = jasmine.createSpyObj('layer2', ['dispose']);
      const layer = jasmine.createSpyObj('layer', ['dispose']);

      asset['layers_'] = [layer1, layer, layer2];

      asset.removeLayer(layer);

      assert(asset.dispatch).to
          .haveBeenCalledWith(DataEvents.CHANGED, <() => void> Matchers.any(Function));
      assert(asset.getLayers()).to.equal([layer1, layer2]);
      assert(layer.dispose).to.haveBeenCalledWith();
    });

    it('should do nothing if the layer does not exist', () => {
      spyOn(asset, 'dispatch').and.callFake((event: any, callback: Function) => {
        callback();
      });

      const layer1 = jasmine.createSpyObj('layer1', ['dispose']);
      const layer2 = jasmine.createSpyObj('layer2', ['dispose']);
      const layer = jasmine.createSpyObj('layer', ['dispose']);

      asset['layers_'] = [layer1, layer2];

      asset.removeLayer(layer);

      assert(asset.dispatch).toNot.haveBeenCalled();
      assert(asset.getLayers()).to.equal([layer1, layer2]);
      assert(layer.dispose).toNot.haveBeenCalled();
    });
  });

  describe('setData', () => {
    it('should dispatch the CHANGED event', () => {
      spyOn(asset, 'dispatch').and.callFake((event: any, callback: Function) => {
        callback();
      });

      const data = Mocks.object('data');

      asset.setData(data);

      assert(asset.dispatch).to
          .haveBeenCalledWith(DataEvents.CHANGED, <() => void> Matchers.any(Function));
      assert(asset.getData()).to.equal(data);
    });

    it('should do nothing if the data is the same', () => {
      spyOn(asset, 'dispatch');

      const data = Mocks.object('data');
      asset['data_'] = data;
      asset.setData(data);

      assert(asset.dispatch).toNot.haveBeenCalled();
      assert(asset.getData()).to.equal(data);
    });
  });

  describe('setFilename', () => {
    it('should dispatch the CHANGED event', () => {
      spyOn(asset, 'dispatch').and.callFake((event: any, callback: Function) => {
        callback();
      });

      const filename = 'filename';
      asset.setFilename(filename);

      assert(asset.dispatch).to
          .haveBeenCalledWith(DataEvents.CHANGED, <() => void> Matchers.any(Function));
      assert(asset.getFilename()).to.equal(filename);
    });

    it('should do nothing if the filename is the same', () => {
      spyOn(asset, 'dispatch');

      const filename = 'filename';
      asset['filename_'] = filename;
      asset.setFilename(filename);

      assert(asset.dispatch).toNot.haveBeenCalled();
      assert(asset.getFilename()).to.equal(filename);
    });
  });

  describe('setHeight', () => {
    it('should dispatch the CHANGED event', () => {
      spyOn(asset, 'dispatch').and.callFake((event: any, callback: Function) => {
        callback();
      });

      const height = 123;

      asset.setHeight(height);

      assert(asset.dispatch).to
          .haveBeenCalledWith(DataEvents.CHANGED, <() => void> Matchers.any(Function));
      assert(asset.getHeight()).to.equal(height);
    });

    it('should not dispatch the CHANGED event if the height does not change', () => {
      spyOn(asset, 'dispatch').and.callFake((event: any, callback: Function) => {
        callback();
      });

      const height = 123;
      asset['height_'] = height;

      asset.setHeight(height);

      assert(asset.dispatch).toNot.haveBeenCalled();
      assert(asset.getHeight()).to.equal(height);
    });
  });

  describe('setHelper', () => {
    it('should dispatch the CHANGED event', () => {
      spyOn(asset, 'dispatch').and.callFake((event: any, callback: Function) => {
        callback();
      });

      const helperId = 'helperId';
      const helper = jasmine.createSpyObj('helper', ['dispose']);

      asset.setHelper(helperId, helper);

      assert(asset.dispatch).to
          .haveBeenCalledWith(DataEvents.CHANGED, <() => void> Matchers.any(Function));
      assert(asset.getHelper(helperId)).to.equal(helper);
    });

    it('should not dispatch the CHANGED event if the helper does not change', () => {
      spyOn(asset, 'dispatch').and.callFake((event: any, callback: Function) => {
        callback();
      });

      const helperId = 'helperId';
      const helper = jasmine.createSpyObj('helper', ['dispose']);
      asset['helpers_'] = {[helperId]: helper};

      asset.setHelper(helperId, helper);

      assert(asset.dispatch).toNot.haveBeenCalled();
      assert(asset.getHelper(helperId)).to.equal(helper);
    });
  });

  describe('setLayers', () => {
    it('should dispatch the CHANGED event', () => {
      spyOn(asset, 'dispatch').and.callFake((event: any, callback: Function) => {
        callback();
      });

      const layers = [jasmine.createSpyObj('layer', ['dispose'])];
      asset.setLayers(layers);

      assert(asset.dispatch).to
          .haveBeenCalledWith(DataEvents.CHANGED, <() => void> Matchers.any(Function));
      assert(asset.getLayers()).to.equal(layers);
    });

    it('should not dispatch the CHANGED event if the layers do not change', () => {
      spyOn(asset, 'dispatch').and.callFake((event: any, callback: Function) => {
        callback();
      });

      const layers = [jasmine.createSpyObj('layer', ['dispose'])];
      asset['layers_'] = layers;

      asset.setLayers(layers);

      assert(asset.dispatch).toNot.haveBeenCalled();
      assert(asset.getLayers()).to.equal(layers);
    });
  });

  describe('setName', () => {
    it('should dispatch the CHANGED event', () => {
      spyOn(asset, 'dispatch').and.callFake((event: any, callback: Function) => {
        callback();
      });

      const name = 'name';

      asset.setName(name);

      assert(asset.dispatch).to
          .haveBeenCalledWith(DataEvents.CHANGED, <() => void> Matchers.any(Function));
      assert(asset.getName()).to.equal(name);
    });

    it('should not dispatch the CHANGED event if the name does not change', () => {
      spyOn(asset, 'dispatch').and.callFake((event: any, callback: Function) => {
        callback();
      });

      const name = 'name';
      asset['name_'] = name;
      asset.setName(name);

      assert(asset.dispatch).toNot.haveBeenCalled();
      assert(asset.getName()).to.equal(name);
    });
  });

  describe('setType', () => {
    it('should dispatch the CHANGED event', () => {
      spyOn(asset, 'dispatch').and.callFake((event: any, callback: Function) => {
        callback();
      });

      const type = AssetType.CARD;

      asset.setType(type);

      assert(asset.dispatch).to
          .haveBeenCalledWith(DataEvents.CHANGED, <() => void> Matchers.any(Function));
      assert(asset.getType()).to.equal(type);
    });

    it('should not dispatch the CHANGED event if the type does not change', () => {
      spyOn(asset, 'dispatch').and.callFake((event: any, callback: Function) => {
        callback();
      });

      const type = AssetType.CARD;
      asset['type_'] = type;
      asset.setType(type);

      assert(asset.dispatch).toNot.haveBeenCalled();
      assert(asset.getType()).to.equal(type);
    });
  });

  describe('setWidth', () => {
    it('should dispatch the CHANGED event', () => {
      spyOn(asset, 'dispatch').and.callFake((event: any, callback: Function) => {
        callback();
      });

      const width = 123;

      asset.setWidth(width);

      assert(asset.dispatch).to
          .haveBeenCalledWith(DataEvents.CHANGED, <() => void> Matchers.any(Function));
      assert(asset.getWidth()).to.equal(width);
    });

    it('should not dispatch the CHANGED event if the width does not change', () => {
      spyOn(asset, 'dispatch').and.callFake((event: any, callback: Function) => {
        callback();
      });

      const width = 123;
      asset['width_'] = width;
      asset.setWidth(width);

      assert(asset.dispatch).toNot.haveBeenCalled();
      assert(asset.getWidth()).to.equal(width);
    });
  });
});


import {assert, TestBase} from '../test-base';
TestBase.setup();

import {Mocks} from 'external/gs_tools/src/mock';
import {TestDispose} from 'external/gs_tools/src/testing';

import {Asset} from '../data/asset';

import {AssetTypeItem} from './asset-type-item';


describe('project.AssetTypeItem', () => {
  let mockMenuService;
  let item: AssetTypeItem;

  beforeEach(() => {
    mockMenuService = jasmine.createSpyObj('MenuService', ['hideMenu']);
    item = new AssetTypeItem(
        Mocks.object('ThemeService'),
        mockMenuService);
    TestDispose.add(item);
  });

  describe('onDataAttributeChange', () => {
    it('should update the name slot', () => {
      let renderedType = 'renderedType';
      spyOn(Asset, 'renderType').and.returnValue(renderedType);

      spyOn(item['nameBridge_'], 'set');

      let assetType = Mocks.object('assetType');
      item['onDataAttributeChange_'](assetType);

      assert(item['nameBridge_'].set).to.haveBeenCalledWith(renderedType);
      assert(Asset.renderType).to.haveBeenCalledWith(assetType);
    });
  });

  describe('onClicked', () => {
    it('should hide the menu', () => {
      item['onClicked_']();
      assert(mockMenuService.hideMenu).to.haveBeenCalledWith();
    });
  });
});

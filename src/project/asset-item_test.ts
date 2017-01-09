import {assert, TestBase} from '../test-base';
TestBase.setup();

import {Mocks} from 'external/gs_tools/src/mock';
import {TestDispose} from 'external/gs_tools/src/testing';

import {AssetItem} from './asset-item';


describe('project.AssetItem', () => {
  let mockAssetCollection;
  let mockRouteFactoryService;
  let mockRouteService;
  let item: AssetItem;

  beforeEach(() => {
    mockAssetCollection = jasmine.createSpyObj('AssetCollection', ['get']);
    mockRouteFactoryService = jasmine.createSpyObj('RouteFactoryService', ['assetMain']);
    mockRouteService = jasmine.createSpyObj('RouteService', ['goTo']);
    item = new AssetItem(
        mockAssetCollection,
        mockRouteFactoryService,
        mockRouteService,
        Mocks.object('ThemeService'));
    TestDispose.add(item);
  });

  describe('onElementclicked_', () => {
    it('should navigate to asset main view', () => {
      let assetId = 'assetId';
      let projectId = 'projectId';
      spyOn(item['gsAssetIdBridge_'], 'get').and.returnValue(assetId);
      spyOn(item['gsProjectIdBridge_'], 'get').and.returnValue(projectId);

      let assetMainFactory = Mocks.object('assetMainFactory');
      mockRouteFactoryService.assetMain.and.returnValue(assetMainFactory);

      item['onElementClicked_']();

      assert(mockRouteService.goTo).to
          .haveBeenCalledWith(assetMainFactory, {assetId: assetId, projectId: projectId});
    });

    it('should not navigate if there are no asset IDs', () => {
      let projectId = 'projectId';
      spyOn(item['gsAssetIdBridge_'], 'get').and.returnValue(null);
      spyOn(item['gsProjectIdBridge_'], 'get').and.returnValue(projectId);

      let assetMainFactory = Mocks.object('assetMainFactory');
      mockRouteFactoryService.assetMain.and.returnValue(assetMainFactory);

      item['onElementClicked_']();

      assert(mockRouteService.goTo).toNot.haveBeenCalled();
    });

    it('should not navigate if there are no project IDs', () => {
      let assetId = 'assetId';
      spyOn(item['gsAssetIdBridge_'], 'get').and.returnValue(assetId);
      spyOn(item['gsProjectIdBridge_'], 'get').and.returnValue(null);

      let assetMainFactory = Mocks.object('assetMainFactory');
      mockRouteFactoryService.assetMain.and.returnValue(assetMainFactory);

      item['onElementClicked_']();

      assert(mockRouteService.goTo).toNot.haveBeenCalled();
    });
  });

  describe('onGsAssetIdChanged_', () => {
    it('should set the asset name correctly', (done: any) => {
      let assetId = 'assetId';
      spyOn(item['gsAssetIdBridge_'], 'get').and.returnValue(assetId);

      let projectId = 'projectId';
      spyOn(item['gsProjectIdBridge_'], 'get').and.returnValue(projectId);

      let name = 'name';
      let mockAsset = jasmine.createSpyObj('Asset', ['getName']);
      mockAssetCollection.get.and.returnValue(Promise.resolve(mockAsset));
      mockAsset.getName.and.returnValue(name);

      spyOn(item['assetNameBridge_'], 'set');

      item['onGsAssetIdChanged_']()
          .then(() => {
            assert(item['assetNameBridge_'].set).to.haveBeenCalledWith(name);
            assert(mockAssetCollection.get).to.haveBeenCalledWith(projectId, assetId);
            done();
          }, done.fail);
    });

    it('should not set the name if the asset is not found', (done: any) => {
      let assetId = 'assetId';
      spyOn(item['gsAssetIdBridge_'], 'get').and.returnValue(assetId);

      let projectId = 'projectId';
      spyOn(item['gsProjectIdBridge_'], 'get').and.returnValue(projectId);

      mockAssetCollection.get.and.returnValue(Promise.resolve(null));

      spyOn(item['assetNameBridge_'], 'set');

      item['onGsAssetIdChanged_']()
          .then(() => {
            assert(item['assetNameBridge_'].set).toNot.haveBeenCalled();
            done();
          }, done.fail);
    });

    it('should delete the name if the asset ID is null', (done: any) => {
      spyOn(item['gsAssetIdBridge_'], 'get').and.returnValue(null);

      let projectId = 'projectId';
      spyOn(item['gsProjectIdBridge_'], 'get').and.returnValue(projectId);

      mockAssetCollection.get.and.returnValue(Promise.resolve(null));

      spyOn(item['assetNameBridge_'], 'set');
      spyOn(item['assetNameBridge_'], 'delete');

      item['onGsAssetIdChanged_']()
          .then(() => {
            assert(item['assetNameBridge_'].set).toNot.haveBeenCalled();
            assert(item['assetNameBridge_'].delete).to.haveBeenCalledWith();
            done();
          }, done.fail);
    });

    it('should delete the name if the project ID is null', (done: any) => {
      let assetId = 'assetId';
      spyOn(item['gsAssetIdBridge_'], 'get').and.returnValue(assetId);

      spyOn(item['gsProjectIdBridge_'], 'get').and.returnValue(null);

      mockAssetCollection.get.and.returnValue(Promise.resolve(null));

      spyOn(item['assetNameBridge_'], 'set');
      spyOn(item['assetNameBridge_'], 'delete');

      item['onGsAssetIdChanged_']()
          .then(() => {
            assert(item['assetNameBridge_'].set).toNot.haveBeenCalled();
            assert(item['assetNameBridge_'].delete).to.haveBeenCalledWith();
            done();
          }, done.fail);
    });
  });
});

import {assert, TestBase} from '../test-base';
TestBase.setup();

import {Mocks} from 'external/gs_tools/src/mock';
import {TestDispose} from 'external/gs_tools/src/testing';

import {Helper} from '../data/helper';

import {HelperListView} from './helper-list-view';


describe('asset.HelperListView', () => {
  let mockAssetCollection;
  let mockRouteFactoryService;
  let mockRouteService;
  let view: HelperListView;

  beforeEach(() => {
    mockAssetCollection = jasmine.createSpyObj('AssetCollection', ['get', 'update']);
    mockRouteFactoryService = jasmine.createSpyObj('RouteFactoryService', ['helper', 'helperList']);
    mockRouteService = jasmine.createSpyObj('RouteService', ['getParams', 'goTo']);
    view = new HelperListView(
        mockAssetCollection,
        mockRouteFactoryService,
        mockRouteService,
        Mocks.object('ThemeService'));
    TestDispose.add(view);
  });

  describe('onCreateButtonClick_', () => {
    it('should create a new helper, update the asset, and navigate to it', (done: any) => {
      let helperListFactory = Mocks.object('helperList');
      mockRouteFactoryService.helperList.and.returnValue(helperListFactory);
      let helperFactory = Mocks.object('helperFactory');
      mockRouteFactoryService.helper.and.returnValue(helperFactory);

      let assetId = 'assetId';
      let projectId = 'projectId';
      mockRouteService.getParams.and.returnValue({assetId, projectId});

      let existingHelperId = 'existingHelperId';
      spyOn(view['helperIdGenerator_'], 'generate').and.returnValue(existingHelperId);

      let newHelperId = 'newHelperId';
      spyOn(view['helperIdGenerator_'], 'resolveConflict').and.returnValue(newHelperId);

      let mockHelper = Mocks.object('newHelper');
      spyOn(Helper, 'of').and.returnValue(mockHelper);

      let existingHelper = Mocks.object('otherHelper');
      let mockAsset = jasmine.createSpyObj('Asset', ['getHelpers', 'setHelpers']);
      mockAsset.getHelpers.and.returnValue({[existingHelperId]: existingHelper});
      mockAssetCollection.get.and.returnValue(Promise.resolve(mockAsset));

      view['onCreateButtonClick_']()
          .then(() => {
            assert(mockRouteService.goTo).to.haveBeenCalledWith(
                helperFactory,
                {
                  assetId: assetId,
                  helperId: newHelperId,
                  projectId: projectId,
                });
            assert(mockAssetCollection.update).to.haveBeenCalledWith(mockAsset, projectId);
            assert(mockAsset.setHelpers).to.haveBeenCalledWith({
              [existingHelperId]: existingHelper,
              [newHelperId]: mockHelper,
            });
            assert(Helper.of).to.haveBeenCalledWith(newHelperId, `Helper ${newHelperId}`);
            assert(view['helperIdGenerator_'].resolveConflict).to
                .haveBeenCalledWith(existingHelperId);
            assert(mockAssetCollection.get).to.haveBeenCalledWith(projectId, assetId);
            assert(mockRouteService.getParams).to.haveBeenCalledWith(helperListFactory);
            done();
          }, done.fail);
    });

    it('should do nothing if the asset cannot be found', (done: any) => {
      let helperListFactory = Mocks.object('helperList');
      mockRouteFactoryService.helperList.and.returnValue(helperListFactory);

      mockRouteService.getParams.and.returnValue({assetId: 'assetId', projectId: 'projectId'});

      mockAssetCollection.get.and.returnValue(Promise.resolve(null));

      view['onCreateButtonClick_']()
          .then(() => {
            assert(mockRouteService.goTo).toNot.haveBeenCalled();
            assert(mockAssetCollection.update).toNot.haveBeenCalled();
            done();
          }, done.fail);
    });

    it('should do nothing if params cannot be determined', (done: any) => {
      let helperListFactory = Mocks.object('helperList');
      mockRouteFactoryService.helperList.and.returnValue(helperListFactory);
      mockRouteService.getParams.and.returnValue(null);

      mockAssetCollection.get.and.returnValue(Promise.resolve(null));

      view['onCreateButtonClick_']()
          .then(() => {
            assert(mockRouteService.goTo).toNot.haveBeenCalled();
            assert(mockAssetCollection.update).toNot.haveBeenCalled();
            done();
          }, done.fail);
    });
  });
});

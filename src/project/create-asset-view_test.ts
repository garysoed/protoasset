import {assert, Matchers, TestBase} from '../test-base';
TestBase.setup();

import {Mocks} from 'external/gs_tools/src/mock';
import {TestDispose} from 'external/gs_tools/src/testing';

import {Asset} from '../data/asset';

import {CreateAssetView} from './create-asset-view';


describe('project.CreateAssetView', () => {
  let mockAssetCollection;
  let mockRouteFactoryService;
  let mockRouteService;
  let view: CreateAssetView;

  beforeEach(() => {
    mockAssetCollection = jasmine.createSpyObj('AssetCollection', ['reserveId', 'update']);
    mockRouteFactoryService =
        jasmine.createSpyObj('RouteFactoryService', ['createAsset', 'assetList']);
    mockRouteService = jasmine.createSpyObj('RouteService', ['getParams', 'goTo']);
    view = new CreateAssetView(
        mockAssetCollection,
        mockRouteFactoryService,
        mockRouteService,
        Mocks.object('ThemeService'));
    TestDispose.add(view);
  });

  describe('getProjectId_', () => {
    it('should return the correct project ID', () => {
      let projectId = 'projectId';

      let routeFactory = Mocks.object('routeFactory');
      mockRouteFactoryService.createAsset.and.returnValue(routeFactory);

      mockRouteService.getParams.and.returnValue({projectId: projectId});

      assert(view['getProjectId_']()).to.equal(projectId);
      assert(mockRouteService.getParams).to.haveBeenCalledWith(routeFactory);
    });

    it('should return null if there are no matches', () => {
      let routeFactory = Mocks.object('routeFactory');
      mockRouteFactoryService.createAsset.and.returnValue(routeFactory);

      mockRouteService.getParams.and.returnValue(null);

      assert(view['getProjectId_']()).to.beNull();
      assert(mockRouteService.getParams).to.haveBeenCalledWith(routeFactory);
    });
  });

  describe('reset_', () => {
    it('should reset all values', () => {
      spyOn(view.widthHook_, 'delete');
      spyOn(view.heightHook_, 'delete');
      spyOn(view.nameHook_, 'delete');
      spyOn(view.assetTypeHook_, 'delete');
      view['reset_']();
      assert(view.widthHook_.delete).to.haveBeenCalledWith();
      assert(view.heightHook_.delete).to.haveBeenCalledWith();
      assert(view.nameHook_.delete).to.haveBeenCalled();
      assert(view.assetTypeHook_.delete).to.haveBeenCalledWith();
    });
  });

  describe('verifyInput_', () => {
    it('should enable the create button if the required fields are set', () => {
      spyOn(view.createButtonDisabledHook_, 'set');
      spyOn(view.nameHook_, 'get').and.returnValue('name');
      spyOn(view.heightHook_, 'get').and.returnValue(123);
      spyOn(view.widthHook_, 'get').and.returnValue(456);
      spyOn(view.assetTypeHook_, 'get').and.returnValue(Mocks.object('assetType'));

      view.verifyInput_();

      assert(view.createButtonDisabledHook_.set).to.haveBeenCalledWith(false);
    });

    it('should disable the create button if the name is not set', () => {
      spyOn(view.createButtonDisabledHook_, 'set');
      spyOn(view.nameHook_, 'get').and.returnValue(null);
      spyOn(view.heightHook_, 'get').and.returnValue(123);
      spyOn(view.widthHook_, 'get').and.returnValue(456);
      spyOn(view.assetTypeHook_, 'get').and.returnValue(Mocks.object('assetType'));
      view.verifyInput_();

      assert(view.createButtonDisabledHook_.set).to.haveBeenCalledWith(true);
    });

    it('should disable the create button if the asset type is not set', () => {
      spyOn(view.createButtonDisabledHook_, 'set');
      spyOn(view.nameHook_, 'get').and.returnValue('name');
      spyOn(view.heightHook_, 'get').and.returnValue(123);
      spyOn(view.widthHook_, 'get').and.returnValue(456);
      spyOn(view.assetTypeHook_, 'get').and.returnValue(null);
      view.verifyInput_();

      assert(view.createButtonDisabledHook_.set).to.haveBeenCalledWith(true);
    });

    it('should disable the create button if the width is zero', () => {
      spyOn(view.createButtonDisabledHook_, 'set');
      spyOn(view.nameHook_, 'get').and.returnValue('name');
      spyOn(view.heightHook_, 'get').and.returnValue(123);
      spyOn(view.widthHook_, 'get').and.returnValue(0);
      spyOn(view.assetTypeHook_, 'get').and.returnValue(Mocks.object('assetType'));
      view.verifyInput_();

      assert(view.createButtonDisabledHook_.set).to.haveBeenCalledWith(true);
    });

    it('should disable the create button if the width is NaN', () => {
      spyOn(view.createButtonDisabledHook_, 'set');
      spyOn(view.nameHook_, 'get').and.returnValue('name');
      spyOn(view.heightHook_, 'get').and.returnValue(123);
      spyOn(view.widthHook_, 'get').and.returnValue(NaN);
      spyOn(view.assetTypeHook_, 'get').and.returnValue(Mocks.object('assetType'));
      view.verifyInput_();

      assert(view.createButtonDisabledHook_.set).to.haveBeenCalledWith(true);
    });

    it('should disable the create button if the height is zero', () => {
      spyOn(view.createButtonDisabledHook_, 'set');
      spyOn(view.nameHook_, 'get').and.returnValue('name');
      spyOn(view.heightHook_, 'get').and.returnValue(0);
      spyOn(view.widthHook_, 'get').and.returnValue(456);
      spyOn(view.assetTypeHook_, 'get').and.returnValue(Mocks.object('assetType'));
      view.verifyInput_();

      assert(view.createButtonDisabledHook_.set).to.haveBeenCalledWith(true);
    });

    it('should disable the create button if the height is NaN', () => {
      spyOn(view.createButtonDisabledHook_, 'set');
      spyOn(view.nameHook_, 'get').and.returnValue('name');
      spyOn(view.heightHook_, 'get').and.returnValue(NaN);
      spyOn(view.widthHook_, 'get').and.returnValue(456);
      spyOn(view.assetTypeHook_, 'get').and.returnValue(Mocks.object('assetType'));
      view.verifyInput_();

      assert(view.createButtonDisabledHook_.set).to.haveBeenCalledWith(true);
    });
  });

  describe('onCancelAction_', () => {
    it('should reset the form and go to the project main view', () => {
      let routeFactory = Mocks.object('routeFactory');
      mockRouteFactoryService.assetList.and.returnValue(routeFactory);

      let projectId = 'projectId';
      spyOn(view, 'reset_');
      spyOn(view, 'getProjectId_').and.returnValue(projectId);

      view['onCancelAction_']();

      assert(mockRouteService.goTo).to.haveBeenCalledWith(routeFactory, {projectId: projectId});
      assert(view['reset_']).to.haveBeenCalledWith();
    });

    it('should do nothing if there are no project IDs', () => {
      spyOn(view, 'reset_');
      spyOn(view, 'getProjectId_').and.returnValue(null);

      view['onCancelAction_']();

      assert(mockRouteService.goTo).toNot.haveBeenCalled();
      assert(view['reset_']).toNot.haveBeenCalled();
    });
  });

  describe('onSubmitAction_', () => {
    it('should create the asset correctly and navigate to the project main view',
    async (done: any) => {
      let routeFactory = Mocks.object('routeFactory');
      mockRouteFactoryService.assetList.and.returnValue(routeFactory);

      let projectId = 'projectId';
      spyOn(view, 'getProjectId_').and.returnValue(projectId);

      spyOn(view, 'reset_');

      let assetName = 'assetName';
      spyOn(view.nameHook_, 'get').and.returnValue(assetName);

      let height = 123;
      spyOn(view.heightHook_, 'get').and.returnValue(height);

      let width = 456;
      spyOn(view.widthHook_, 'get').and.returnValue(width);

      let assetType = Mocks.object('assetType');
      spyOn(view.assetTypeHook_, 'get').and.returnValue(assetType);

      let assetId = 'assetId';
      mockAssetCollection.reserveId.and.returnValue(Promise.resolve(assetId));

      await view.onSubmitAction_();
      assert(mockRouteService.goTo).to
          .haveBeenCalledWith(routeFactory, {projectId: projectId});
      assert(view['reset_']).to.haveBeenCalledWith();

      assert(mockAssetCollection.update).to.haveBeenCalledWith(Matchers.any(Asset));

      let asset = mockAssetCollection.update.calls.argsFor(0)[0];
      assert(asset.getName()).to.equal(assetName);
      assert(asset.getType()).to.equal(assetType);
      assert(asset.getId()).to.equal(assetId);
      assert(asset.getHeight()).to.equal(height);
      assert(asset.getWidth()).to.equal(width);
      TestDispose.add(asset);

      assert(mockAssetCollection.reserveId).to.haveBeenCalledWith(projectId);
    });

    it('should do nothing if there are no project IDs', async (done: any) => {
      spyOn(view, 'getProjectId_').and.returnValue(null);

      spyOn(view, 'reset_');

      spyOn(view.nameHook_, 'get').and.returnValue('assetName');
      spyOn(view.heightHook_, 'get').and.returnValue(123);
      spyOn(view.widthHook_, 'get').and.returnValue(456);

      let assetType = Mocks.object('assetType');
      spyOn(view.assetTypeHook_, 'get').and.returnValue(assetType);

      await view.onSubmitAction_();
      assert(mockRouteService.goTo).toNot.haveBeenCalled();
      assert(view['reset_']).toNot.haveBeenCalled();

      assert(mockAssetCollection.update).toNot.haveBeenCalled();
    });

    it('should reject if project name is not set', async (done: any) => {
      spyOn(view.nameHook_, 'get').and.returnValue(null);

      try {
        await view.onSubmitAction_();
        done.fail();
      } catch (e) {
        const error: Error = e;
        assert(error.message).to.equal(Matchers.stringMatching(/Project name/));
      }
    });

    it('should reject if the asset type is not set', async (done: any) => {
      let assetName = 'assetName';
      spyOn(view.nameHook_, 'get').and.returnValue(assetName);
      spyOn(view.assetTypeHook_, 'get').and.returnValue(null);

      try {
        await view.onSubmitAction_();
        done.fail();
      } catch (e) {
        const error: Error = e;
        assert(error.message).to.equal(Matchers.stringMatching(/Asset type/));
      }
    });

    it('should reject if the height is null', async (done: any) => {
      spyOn(view, 'getProjectId_').and.returnValue(null);

      spyOn(view, 'reset_');

      spyOn(view.nameHook_, 'get').and.returnValue('assetName');
      spyOn(view.heightHook_, 'get').and.returnValue(null);
      spyOn(view.widthHook_, 'get').and.returnValue(456);
      spyOn(view.assetTypeHook_, 'get').and.returnValue(Mocks.object('assetType'));

      try {
        await view.onSubmitAction_();
        done.fail();
      } catch (e) {
        const error: Error = e;
        assert(error.message).to.equal(Matchers.stringMatching(/Asset height/));
      }
    });

    it('should reject if the height is NaN', async (done: any) => {
      spyOn(view, 'getProjectId_').and.returnValue(null);

      spyOn(view, 'reset_');

      spyOn(view.nameHook_, 'get').and.returnValue('assetName');
      spyOn(view.heightHook_, 'get').and.returnValue(NaN);
      spyOn(view.widthHook_, 'get').and.returnValue(456);
      spyOn(view.assetTypeHook_, 'get').and.returnValue(Mocks.object('assetType'));

      try {
        await view.onSubmitAction_();
        done.fail();
      } catch (e) {
        const error: Error = e;
        assert(error.message).to.equal(Matchers.stringMatching(/Asset height/));
      }
    });

    it('should reject if the width is null', async (done: any) => {
      spyOn(view, 'getProjectId_').and.returnValue(null);

      spyOn(view, 'reset_');

      spyOn(view.nameHook_, 'get').and.returnValue('assetName');
      spyOn(view.heightHook_, 'get').and.returnValue(123);
      spyOn(view.widthHook_, 'get').and.returnValue(null);
      spyOn(view.assetTypeHook_, 'get').and.returnValue(Mocks.object('assetType'));

      try {
        await view.onSubmitAction_();
        done.fail();
      } catch (e) {
        const error: Error = e;
        assert(error.message).to.equal(Matchers.stringMatching(/Asset width/));
      }
    });

    it('should reject if the width is NaN', async (done: any) => {
      spyOn(view, 'getProjectId_').and.returnValue(null);

      spyOn(view, 'reset_');

      spyOn(view.nameHook_, 'get').and.returnValue('assetName');
      spyOn(view.heightHook_, 'get').and.returnValue(123);
      spyOn(view.widthHook_, 'get').and.returnValue(NaN);
      spyOn(view.assetTypeHook_, 'get').and.returnValue(Mocks.object('assetType'));

      try {
        await view.onSubmitAction_();
        done.fail();
      } catch (e) {
        const error: Error = e;
        assert(error.message).to.equal(Matchers.stringMatching(/Asset width/));
      }
    });
  });
});

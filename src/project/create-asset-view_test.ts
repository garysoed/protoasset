import { assert, Matchers, TestBase } from '../test-base';
TestBase.setup();

import { DataModels, FakeDataAccess } from 'external/gs_tools/src/datamodel';
import { FakeMonadSetter, MonadUtil } from 'external/gs_tools/src/event';
import { ImmutableMap } from 'external/gs_tools/src/immutable';
import { Mocks } from 'external/gs_tools/src/mock';
import { TestDispose } from 'external/gs_tools/src/testing';

import { FakeRouteFactory, FakeRouteNavigator, RouteNavigator } from 'external/gs_ui/src/routing';
import { Views } from 'src/routing/views';
import { Asset2, AssetType } from '../data/asset2';
import { Project } from '../data/project';
import { CreateAssetView } from './create-asset-view';


describe('project.CreateAssetView', () => {
  let mockRouteFactoryService: any;
  let view: CreateAssetView;

  beforeEach(() => {
    mockRouteFactoryService =
        jasmine.createSpyObj('RouteFactoryService', ['createAsset', 'assetList']);
    view = new CreateAssetView(
        mockRouteFactoryService,
        Mocks.object('RouteService'),
        Mocks.object('ThemeService'));
    TestDispose.add(view);
  });

  describe('getProjectId_', () => {
    it('should return the correct project ID', () => {
      const projectId = 'projectId';

      const routeFactory = Mocks.object('routeFactory');
      mockRouteFactoryService.createAsset.and.returnValue(routeFactory);

      const mockRouteNavigator = jasmine.createSpyObj('RouteNavigator', ['getRoute']);
      mockRouteNavigator.getRoute.and.returnValue({params: {projectId}});

      assert(view['getProjectId_'](mockRouteNavigator)).to.equal(projectId);
      assert(mockRouteNavigator.getRoute).to.haveBeenCalledWith(routeFactory);
    });

    it('should return null if there are no matches', () => {
      const routeFactory = Mocks.object('routeFactory');
      mockRouteFactoryService.createAsset.and.returnValue(routeFactory);

      const mockRouteNavigator = jasmine.createSpyObj('RouteNavigator', ['getRoute']);
      mockRouteNavigator.getRoute.and.returnValue(null);

      assert(view['getProjectId_'](mockRouteNavigator)).to.beNull();
      assert(mockRouteNavigator.getRoute).to.haveBeenCalledWith(routeFactory);
    });
  });

  describe('onCancelAction_', () => {
    it('should reset the form and go to the project main view', () => {
      const fakeRouteFactory = new FakeRouteFactory(Views.PROJECT);
      mockRouteFactoryService.assetList.and.returnValue(fakeRouteFactory);

      const projectId = 'projectId';
      spyOn(view, 'getProjectId_').and.returnValue(projectId);

      const fakeRouteNavigator = new FakeRouteNavigator<Views>();
      const fakeRouteSetter = new FakeMonadSetter<RouteNavigator<Views>>(fakeRouteNavigator);

      const updates = view.onCancelAction_(fakeRouteSetter);
      assert(fakeRouteSetter.findValue(updates)!.value.getDestination()!).to.matchObject({
        params: {projectId},
        type: Views.PROJECT,
      });
      assert(view['getProjectId_']).to.haveBeenCalledWith(fakeRouteNavigator);
    });

    it('should do nothing if there are no project IDs', () => {
      spyOn(view, 'getProjectId_').and.returnValue(null);

      const fakeRouteNavigator = new FakeRouteNavigator<Views>();
      const fakeRouteSetter = new FakeMonadSetter<RouteNavigator<Views>>(fakeRouteNavigator);

      assert(view.onCancelAction_(fakeRouteSetter)).to.equal([]);
    });
  });

  describe('onSubmitAction_', () => {
    it('should create the asset correctly and navigate to the project main view',
        async () => {
      const fakeRouteFactory = new FakeRouteFactory(Views.PROJECT);
      mockRouteFactoryService.assetList.and.returnValue(fakeRouteFactory);

      const projectId = 'projectId';
      spyOn(view, 'getProjectId_').and.returnValue(projectId);

      const assetName = 'assetName';
      const height = 123;
      const width = 456;
      const assetType = Mocks.object('assetType');
      const assetId = 'assetId';

      spyOn(MonadUtil, 'callFunction');

      const fakeProjectAccess = new FakeDataAccess<Project>(ImmutableMap.of([
        [projectId, DataModels.newInstance<Project>(Project)],
      ]));
      const fakeProjectAccessSetter =
          new FakeMonadSetter<FakeDataAccess<Project>>(fakeProjectAccess);
      const fakeAssetAccess = new FakeDataAccess<Asset2>();
      const fakeAssetAccessSetter = new FakeMonadSetter<FakeDataAccess<Asset2>>(fakeAssetAccess);

      const fakeRouteNavigator = new FakeRouteNavigator<Views>();
      const fakeRouteSetter = new FakeMonadSetter<RouteNavigator<Views>>(fakeRouteNavigator);

      const updates = await view.onSubmitAction_(
          assetName,
          assetType,
          height,
          width,
          Promise.resolve(assetId),
          fakeProjectAccessSetter,
          fakeAssetAccessSetter,
          fakeRouteSetter);

      assert(fakeRouteSetter.findValue(updates)!.value.getDestination()!).to.matchObject({
        params: {projectId},
        type: Views.PROJECT,
      });

      const updatedProject = fakeProjectAccessSetter.findValue(updates)!.value
          .getUpdateQueue()
          .get(projectId);
      assert(updatedProject!.getAssets()).to.haveElements([assetId]);

      const asset = fakeAssetAccessSetter.findValue(updates)!.value.getUpdateQueue().get(assetId)!;
      assert(asset.getName()).to.equal(assetName);
      assert(asset.getType()).to.equal(assetType);
      assert(asset.getId()).to.equal(assetId);
      assert(asset.getHeight()).to.equal(height);
      assert(asset.getWidth()).to.equal(width);

      assert(MonadUtil.callFunction).to.haveBeenCalledWith(Matchers.anyThing(), view, 'reset_');
    });

    it('should do nothing if there are no project IDs', async () => {
      const routeFactory = Mocks.object('routeFactory');
      mockRouteFactoryService.assetList.and.returnValue(routeFactory);

      spyOn(view, 'getProjectId_').and.returnValue(null);

      spyOn(MonadUtil, 'callFunction');

      const fakeProjectAccess = new FakeDataAccess<Project>();
      const fakeProjectAccessSetter =
          new FakeMonadSetter<FakeDataAccess<Project>>(fakeProjectAccess);
      const fakeAssetAccess = new FakeDataAccess<Asset2>();
      const fakeAssetAccessSetter = new FakeMonadSetter<FakeDataAccess<Asset2>>(fakeAssetAccess);

      const fakeRouteNavigator = new FakeRouteNavigator<Views>();
      const fakeRouteSetter = new FakeMonadSetter<RouteNavigator<Views>>(fakeRouteNavigator);

      const updates = await view.onSubmitAction_(
          'assetName',
          AssetType.CARD,
          123,
          456,
          Promise.resolve('assetId'),
          fakeProjectAccessSetter,
          fakeAssetAccessSetter,
          fakeRouteSetter);

      assert([...updates]).to.equal([]);
      assert(MonadUtil.callFunction).toNot.haveBeenCalled();
    });

    it('should reject if asset name is not set', async () => {
      const fakeProjectAccess = new FakeDataAccess<Project>();
      const fakeProjectAccessSetter =
          new FakeMonadSetter<FakeDataAccess<Project>>(fakeProjectAccess);
      const fakeAssetAccess = new FakeDataAccess<Asset2>();
      const fakeAssetAccessSetter = new FakeMonadSetter<FakeDataAccess<Asset2>>(fakeAssetAccess);

      const fakeRouteNavigator = new FakeRouteNavigator<Views>();
      const fakeRouteSetter = new FakeMonadSetter<RouteNavigator<Views>>(fakeRouteNavigator);

      await assert(view.onSubmitAction_(
          null,
          AssetType.CARD,
          123,
          456,
          Promise.resolve('assetId'),
          fakeProjectAccessSetter,
          fakeAssetAccessSetter,
          fakeRouteSetter)).to.rejectWithError(/Asset name/);
    });

    it('should reject if the asset type is not set', async () => {
      const fakeProjectAccess = new FakeDataAccess<Project>();
      const fakeProjectAccessSetter =
          new FakeMonadSetter<FakeDataAccess<Project>>(fakeProjectAccess);
      const fakeAssetAccess = new FakeDataAccess<Asset2>();
      const fakeAssetAccessSetter = new FakeMonadSetter<FakeDataAccess<Asset2>>(fakeAssetAccess);

      const fakeRouteNavigator = new FakeRouteNavigator<Views>();
      const fakeRouteSetter = new FakeMonadSetter<RouteNavigator<Views>>(fakeRouteNavigator);

      await assert(view.onSubmitAction_(
          'name',
          null,
          123,
          456,
          Promise.resolve('assetId'),
          fakeProjectAccessSetter,
          fakeAssetAccessSetter,
          fakeRouteSetter)).to.rejectWithError(/Asset type/);
    });

    it('should reject if the height is null', async () => {
      const fakeProjectAccess = new FakeDataAccess<Project>();
      const fakeProjectAccessSetter =
          new FakeMonadSetter<FakeDataAccess<Project>>(fakeProjectAccess);
      const fakeAssetAccess = new FakeDataAccess<Asset2>();
      const fakeAssetAccessSetter = new FakeMonadSetter<FakeDataAccess<Asset2>>(fakeAssetAccess);

      const fakeRouteNavigator = new FakeRouteNavigator<Views>();
      const fakeRouteSetter = new FakeMonadSetter<RouteNavigator<Views>>(fakeRouteNavigator);

      await assert(view.onSubmitAction_(
          'name',
          AssetType.CARD,
          null,
          456,
          Promise.resolve('assetId'),
          fakeProjectAccessSetter,
          fakeAssetAccessSetter,
          fakeRouteSetter)).to.rejectWithError(/Asset height/);
    });

    it('should reject if the height is NaN', async () => {
      const fakeProjectAccess = new FakeDataAccess<Project>();
      const fakeProjectAccessSetter =
          new FakeMonadSetter<FakeDataAccess<Project>>(fakeProjectAccess);
      const fakeAssetAccess = new FakeDataAccess<Asset2>();
      const fakeAssetAccessSetter = new FakeMonadSetter<FakeDataAccess<Asset2>>(fakeAssetAccess);

      const fakeRouteNavigator = new FakeRouteNavigator<Views>();
      const fakeRouteSetter = new FakeMonadSetter<RouteNavigator<Views>>(fakeRouteNavigator);

      await assert(view.onSubmitAction_(
          'name',
          AssetType.CARD,
          NaN,
          456,
          Promise.resolve('assetId'),
          fakeProjectAccessSetter,
          fakeAssetAccessSetter,
          fakeRouteSetter)).to.rejectWithError(/Asset height/);
    });

    it('should reject if the width is null', async () => {
      const fakeProjectAccess = new FakeDataAccess<Project>();
      const fakeProjectAccessSetter =
          new FakeMonadSetter<FakeDataAccess<Project>>(fakeProjectAccess);
      const fakeAssetAccess = new FakeDataAccess<Asset2>();
      const fakeAssetAccessSetter = new FakeMonadSetter<FakeDataAccess<Asset2>>(fakeAssetAccess);

      const fakeRouteNavigator = new FakeRouteNavigator<Views>();
      const fakeRouteSetter = new FakeMonadSetter<RouteNavigator<Views>>(fakeRouteNavigator);

      await assert(view.onSubmitAction_(
          'name',
          AssetType.CARD,
          123,
          null,
          Promise.resolve('assetId'),
          fakeProjectAccessSetter,
          fakeAssetAccessSetter,
          fakeRouteSetter)).to.rejectWithError(/Asset width/);
    });

    it('should reject if the width is NaN', async () => {
      const fakeProjectAccess = new FakeDataAccess<Project>();
      const fakeProjectAccessSetter =
          new FakeMonadSetter<FakeDataAccess<Project>>(fakeProjectAccess);
      const fakeAssetAccess = new FakeDataAccess<Asset2>();
      const fakeAssetAccessSetter = new FakeMonadSetter<FakeDataAccess<Asset2>>(fakeAssetAccess);
      const fakeRouteNavigator = new FakeRouteNavigator<Views>();
      const fakeRouteSetter = new FakeMonadSetter<RouteNavigator<Views>>(fakeRouteNavigator);

      await assert(view.onSubmitAction_(
          'name',
          AssetType.CARD,
          123,
          NaN,
          Promise.resolve('assetId'),
          fakeProjectAccessSetter,
          fakeAssetAccessSetter,
          fakeRouteSetter)).to.rejectWithError(/Asset width/);
    });
  });

  describe('reset_', () => {
    it('should reset all values', () => {
      const fakeAssetNameSetter = new FakeMonadSetter<string | null>('name');
      const fakeAssetTypeSetter = new FakeMonadSetter<AssetType | null>(AssetType.CARD);
      const fakeHeightSetter = new FakeMonadSetter<number | null>(123);
      const fakeWidthSetter = new FakeMonadSetter<number | null>(456);

      const updates =
          view.reset_(fakeAssetNameSetter, fakeAssetTypeSetter, fakeHeightSetter, fakeWidthSetter);
      assert(fakeAssetNameSetter.findValue(updates)!.value).to.beNull();
      assert(fakeHeightSetter.findValue(updates)!.value).to.beNull();
      assert(fakeWidthSetter.findValue(updates)!.value).to.beNull();
      assert(fakeAssetTypeSetter.findValue(updates)!.value).to.beNull();
    });
  });

  describe('verifyInput_', () => {
    it('should enable the create button if the required fields are set', () => {
      const fakeCreateDisabledSetter = new FakeMonadSetter<boolean | null>(null);

      const updates = view.verifyInput_('name', AssetType.CARD, 123, 456, fakeCreateDisabledSetter);
      assert(fakeCreateDisabledSetter.findValue(updates)!.value).to.beFalse();
    });

    it('should disable the create button if the name is not set', () => {
      const fakeCreateDisabledSetter = new FakeMonadSetter<boolean | null>(null);

      const updates = view.verifyInput_(null, AssetType.CARD, 123, 456, fakeCreateDisabledSetter);
      assert(fakeCreateDisabledSetter.findValue(updates)!.value).to.beTrue();
    });

    it('should disable the create button if the asset type is not set', () => {
      const fakeCreateDisabledSetter = new FakeMonadSetter<boolean | null>(null);

      const updates = view.verifyInput_('name', null, 123, 456, fakeCreateDisabledSetter);
      assert(fakeCreateDisabledSetter.findValue(updates)!.value).to.beTrue();
    });

    it('should disable the create button if the width is zero', () => {
      const fakeCreateDisabledSetter = new FakeMonadSetter<boolean | null>(null);

      const updates = view.verifyInput_('name', AssetType.CARD, 123, 0, fakeCreateDisabledSetter);
      assert(fakeCreateDisabledSetter.findValue(updates)!.value).to.beTrue();
    });

    it('should disable the create button if the width is NaN', () => {
      const fakeCreateDisabledSetter = new FakeMonadSetter<boolean | null>(null);

      const updates = view.verifyInput_('name', AssetType.CARD, 123, NaN, fakeCreateDisabledSetter);
      assert(fakeCreateDisabledSetter.findValue(updates)!.value).to.beTrue();
    });

    it('should disable the create button if the height is zero', () => {
      const fakeCreateDisabledSetter = new FakeMonadSetter<boolean | null>(null);

      const updates = view.verifyInput_('name', AssetType.CARD, 0, 456, fakeCreateDisabledSetter);
      assert(fakeCreateDisabledSetter.findValue(updates)!.value).to.beTrue();
    });

    it('should disable the create button if the height is NaN', () => {
      const fakeCreateDisabledSetter = new FakeMonadSetter<boolean | null>(null);

      const updates = view.verifyInput_('name', AssetType.CARD, NaN, 456, fakeCreateDisabledSetter);
      assert(fakeCreateDisabledSetter.findValue(updates)!.value).to.beTrue();
    });
  });
});

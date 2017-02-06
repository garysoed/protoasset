import {assert, Matchers, TestBase} from '../test-base';
TestBase.setup();

import {DomEvent, ListenableDom} from 'external/gs_tools/src/event';
import {Mocks} from 'external/gs_tools/src/mock';
import {TestDispose} from 'external/gs_tools/src/testing';

import {Asset, AssetType} from '../data/asset';

import {ASSET_PRESETS, PresetType, Render} from './asset-presets';
import {
  ASSET_MAP_,
  assetTypeMenuDataSetter,
  assetTypeMenuGenerator,
  CreateAssetView,
  presetTypeMenuDataSetter,
  presetTypeMenuGenerator} from './create-asset-view';


describe('assetTypeMenuGenerator', () => {
  it('should create the element correctly and listen to the click event', () => {
    let mockView = Mocks.disposable('View');
    mockView.onTypeClicked = jasmine.createSpy('View.onTypeClicked');
    TestDispose.add(mockView);

    let mockListenableElement = Mocks.listenable('ListenableElement');
    spyOn(mockListenableElement, 'on').and.callThrough();
    TestDispose.add(mockListenableElement);
    spyOn(ListenableDom, 'of').and.returnValue(mockListenableElement);

    let element = Mocks.object('element');
    let mockDocument = jasmine.createSpyObj('Document', ['createElement']);
    mockDocument.createElement.and.returnValue(element);

    assert(assetTypeMenuGenerator(mockDocument, mockView)).to.equal(element);
    assert(mockListenableElement.on).to
        .haveBeenCalledWith(DomEvent.CLICK, mockView.onTypeClicked, mockView);
    assert(ListenableDom.of).to.haveBeenCalledWith(element);
    assert(mockDocument.createElement).to.haveBeenCalledWith('gs-menu-item');
  });
});

describe('assetTypeMenuDataSetter', () => {
  it('should set the attribute correctly', () => {
    let renderedAsset = 'renderedAsset';
    spyOn(Asset, 'renderType').and.returnValue(renderedAsset);

    let mockElement = jasmine.createSpyObj('Element', ['setAttribute']);

    assetTypeMenuDataSetter(AssetType.CARD, mockElement);

    assert(mockElement.setAttribute).to.haveBeenCalledWith('gs-value', 'card');
    assert(mockElement.setAttribute).to.haveBeenCalledWith('gs-content', renderedAsset);
    assert(Asset.renderType).to.haveBeenCalledWith(AssetType.CARD);
  });
});

describe('presetTypeMenuGenerator', () => {
  it('should create the element correctly and listen to the click event', () => {
    let mockView = Mocks.disposable('View');
    mockView.onPresetClicked = jasmine.createSpy('View.onPresetClicked');
    TestDispose.add(mockView);

    let mockListenableElement = Mocks.listenable('ListenableElement');
    spyOn(mockListenableElement, 'on').and.callThrough();
    TestDispose.add(mockListenableElement);
    spyOn(ListenableDom, 'of').and.returnValue(mockListenableElement);

    let element = Mocks.object('element');
    let mockDocument = jasmine.createSpyObj('Document', ['createElement']);
    mockDocument.createElement.and.returnValue(element);

    assert(presetTypeMenuGenerator(mockDocument, mockView)).to.equal(element);
    assert(mockListenableElement.on).to
        .haveBeenCalledWith(DomEvent.CLICK, mockView.onPresetClicked, mockView);
    assert(ListenableDom.of).to.haveBeenCalledWith(element);
    assert(mockDocument.createElement).to.haveBeenCalledWith('gs-menu-item');
  });
});

describe('presetTypeMenuDataSetter', () => {
  it('should set the attributes correctly', () => {
    let renderedPreset = 'renderedPreset';
    spyOn(Render, 'preset').and.returnValue(renderedPreset);

    let mockElement = jasmine.createSpyObj('Element', ['setAttribute']);

    presetTypeMenuDataSetter(PresetType.GAME_CRAFTER_DECK_POKER, mockElement);

    assert(mockElement.setAttribute).to.haveBeenCalledWith('gs-value', 'game_crafter_deck_poker');
    assert(mockElement.setAttribute).to.haveBeenCalledWith('gs-content', renderedPreset);
    assert(Render.preset).to.haveBeenCalledWith(PresetType.GAME_CRAFTER_DECK_POKER);
  });
});

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
      spyOn(view, 'setAssetType_');
      spyOn(view['nameValueHook_'], 'set');
      view['reset_']();
      assert(view['nameValueHook_'].set).to.haveBeenCalledWith('');
      assert(view['setAssetType_']).to.haveBeenCalledWith(null);
    });
  });

  describe('setAssetType_', () => {
    it('should set the bridge correctly if the type is non null', () => {
      let renderedType = 'renderedType';
      spyOn(Asset, 'renderType').and.returnValue(renderedType);

      let assetType = Mocks.object('assetType');

      spyOn(view, 'updateTemplateSection_');
      spyOn(view, 'verifyInput_');
      spyOn(view['assetTypeHook_'], 'set');

      view['setAssetType_'](assetType);

      assert(view['verifyInput_']).to.haveBeenCalledWith();
      assert(view['assetTypeHook_'].set).to.haveBeenCalledWith(renderedType);
      assert(view['updateTemplateSection_']).to.haveBeenCalledWith();
      assert(Asset.renderType).to.haveBeenCalledWith(assetType);
    });

    it('should set the bridge correctly if the type is null', () => {
      spyOn(view, 'updateTemplateSection_');
      spyOn(view, 'verifyInput_');
      spyOn(view['assetTypeHook_'], 'set');

      view['setAssetType_'](null);

      assert(view['verifyInput_']).to.haveBeenCalledWith();
      assert(view['updateTemplateSection_']).to.haveBeenCalledWith();
      assert(view['assetTypeHook_'].set).to
          .haveBeenCalledWith(Matchers.stringMatching(/Select a type/));
    });
  });

  describe('setPresetType_', () => {
    it('should set the preset correctly', () => {
      let presetType = PresetType.GAME_CRAFTER_DECK_SQUARE;
      let renderedPreset = 'renderedPreset';
      spyOn(Render, 'preset').and.returnValue(renderedPreset);

      let height = 123;
      let width = 456;
      let presetObj = {heightPx: height, widthPx: width};
      spyOn(ASSET_PRESETS, 'get').and.returnValue(presetObj);

      spyOn(view['presetTypeHook_'], 'set');
      spyOn(view['templateHeightHook_'], 'set');
      spyOn(view['templateWidthHook_'], 'set');
      spyOn(view, 'verifyInput_');

      view['setPresetType_'](presetType);

      assert(view['verifyInput_']).to.haveBeenCalledWith();
      assert(view['templateHeightHook_'].set).to.haveBeenCalledWith(height);
      assert(view['templateWidthHook_'].set).to.haveBeenCalledWith(width);
      assert(ASSET_PRESETS.get).to.haveBeenCalledWith(presetType);
      assert(view['presetTypeHook_'].set).to.haveBeenCalledWith(renderedPreset);
      assert(view['presetType_']).to.equal(presetType);
    });

    it('should handle where there are no corresponding preset object', () => {
      let presetType = PresetType.GAME_CRAFTER_DECK_SQUARE;
      spyOn(Render, 'preset').and.returnValue('renderedPreset');

      spyOn(ASSET_PRESETS, 'get').and.returnValue(undefined);

      spyOn(view['presetTypeHook_'], 'set');
      spyOn(view['templateHeightHook_'], 'set');
      spyOn(view['templateWidthHook_'], 'set');
      spyOn(view, 'verifyInput_');

      view['setPresetType_'](presetType);

      assert(view['verifyInput_']).to.haveBeenCalledWith();
      assert(view['templateHeightHook_'].set).toNot.haveBeenCalled();
      assert(view['templateWidthHook_'].set).toNot.haveBeenCalled();
      assert(view['presetType_']).to.equal(presetType);
    });

    it('should handle the case where the preset type is null', () => {
      spyOn(ASSET_PRESETS, 'get').and.returnValue(undefined);

      spyOn(view['presetTypeHook_'], 'set');
      spyOn(view['templateHeightHook_'], 'set');
      spyOn(view['templateWidthHook_'], 'set');
      spyOn(view, 'verifyInput_');

      view['setPresetType_'](null);

      assert(view['verifyInput_']).to.haveBeenCalledWith();
      assert(view['templateHeightHook_'].set).toNot.haveBeenCalled();
      assert(view['templateWidthHook_'].set).toNot.haveBeenCalled();
      assert(view['presetTypeHook_'].set).to
          .haveBeenCalledWith(Matchers.stringMatching(/Select/));
      assert(view['presetType_']).to.beNull();
    });
  });

  describe('updateTemplateSection_', () => {
    it('should set the class and presets correctly, and verify inputs', () => {
      spyOn(view['templateSectionHiddenHook_'], 'set');

      spyOn(view, 'verifyInput_');
      spyOn(view['presetTypeMenuHook_'], 'set');
      spyOn(view['presetTypeHook_'], 'set');

      let presetSet = Mocks.object('presetSet');
      spyOn(ASSET_MAP_, 'get').and.returnValue(presetSet);

      let assetType = AssetType.CARD;
      view['assetType_'] = assetType;

      view['updateTemplateSection_']();

      assert(view['verifyInput_']).to.haveBeenCalledWith();
      assert(view['templateSectionHiddenHook_'].set).to.haveBeenCalledWith(false);
      assert(view['presetTypeMenuHook_'].set).to.haveBeenCalledWith(presetSet);
      assert(view['presetTypeHook_'].set).to.haveBeenCalledWith('');
      assert(ASSET_MAP_.get).to.haveBeenCalledWith(assetType);
    });

    it('should set the class and presets correctly if there are no asset types', () => {
      spyOn(view['templateSectionHiddenHook_'], 'set');

      spyOn(view, 'verifyInput_');
      spyOn(view['presetTypeMenuHook_'], 'set');
      spyOn(view['presetTypeHook_'], 'set');

      view['assetType_'] = null;

      view['updateTemplateSection_']();

      assert(view['verifyInput_']).to.haveBeenCalledWith();
      assert(view['templateSectionHiddenHook_'].set).to.haveBeenCalledWith(true);
      assert(view['presetTypeMenuHook_'].set).to.haveBeenCalledWith([]);
      assert(view['presetTypeHook_'].set).to.haveBeenCalledWith('');
    });
  });

  describe('verifyInput_', () => {
    it('should enable the create button if the required fields are set', () => {
      spyOn(view['createButtonDisabledHook_'], 'set');
      spyOn(view['nameValueHook_'], 'get').and.returnValue('name');
      spyOn(view['templateHeightHook_'], 'get').and.returnValue(123);
      spyOn(view['templateWidthHook_'], 'get').and.returnValue(456);

      view['assetType_'] = Mocks.object('assetType');
      view['verifyInput_']();

      assert(view['createButtonDisabledHook_'].set).to.haveBeenCalledWith(false);
    });

    it('should disable the create button if the name is not set', () => {
      spyOn(view['createButtonDisabledHook_'], 'set');
      spyOn(view['nameValueHook_'], 'get').and.returnValue(null);
      spyOn(view['templateHeightHook_'], 'get').and.returnValue(123);
      spyOn(view['templateWidthHook_'], 'get').and.returnValue(456);
      view['assetType_'] = Mocks.object('assetType');
      view['verifyInput_']();

      assert(view['createButtonDisabledHook_'].set).to.haveBeenCalledWith(true);
    });

    it('should disable the create button if the asset type is not set', () => {
      spyOn(view['createButtonDisabledHook_'], 'set');
      spyOn(view['nameValueHook_'], 'get').and.returnValue('name');
      spyOn(view['templateHeightHook_'], 'get').and.returnValue(123);
      spyOn(view['templateWidthHook_'], 'get').and.returnValue(456);
      view['assetType_'] = null;
      view['verifyInput_']();

      assert(view['createButtonDisabledHook_'].set).to.haveBeenCalledWith(true);
    });

    it('should disable the create button if the width is zero', () => {
      spyOn(view['createButtonDisabledHook_'], 'set');
      spyOn(view['nameValueHook_'], 'get').and.returnValue('name');
      spyOn(view['templateHeightHook_'], 'get').and.returnValue(123);
      spyOn(view['templateWidthHook_'], 'get').and.returnValue(0);

      view['assetType_'] = Mocks.object('assetType');
      view['verifyInput_']();

      assert(view['createButtonDisabledHook_'].set).to.haveBeenCalledWith(true);
    });

    it('should disable the create button if the width is NaN', () => {
      spyOn(view['createButtonDisabledHook_'], 'set');
      spyOn(view['nameValueHook_'], 'get').and.returnValue('name');
      spyOn(view['templateHeightHook_'], 'get').and.returnValue(123);
      spyOn(view['templateWidthHook_'], 'get').and.returnValue(NaN);

      view['assetType_'] = Mocks.object('assetType');
      view['verifyInput_']();

      assert(view['createButtonDisabledHook_'].set).to.haveBeenCalledWith(true);
    });

    it('should disable the create button if the height is zero', () => {
      spyOn(view['createButtonDisabledHook_'], 'set');
      spyOn(view['nameValueHook_'], 'get').and.returnValue('name');
      spyOn(view['templateHeightHook_'], 'get').and.returnValue(0);
      spyOn(view['templateWidthHook_'], 'get').and.returnValue(456);

      view['assetType_'] = Mocks.object('assetType');
      view['verifyInput_']();

      assert(view['createButtonDisabledHook_'].set).to.haveBeenCalledWith(true);
    });

    it('should disable the create button if the height is NaN', () => {
      spyOn(view['createButtonDisabledHook_'], 'set');
      spyOn(view['nameValueHook_'], 'get').and.returnValue('name');
      spyOn(view['templateHeightHook_'], 'get').and.returnValue(NaN);
      spyOn(view['templateWidthHook_'], 'get').and.returnValue(456);

      view['assetType_'] = Mocks.object('assetType');
      view['verifyInput_']();

      assert(view['createButtonDisabledHook_'].set).to.haveBeenCalledWith(true);
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
      spyOn(view['nameValueHook_'], 'get').and.returnValue(assetName);

      let height = 123;
      spyOn(view['templateHeightHook_'], 'get').and.returnValue(height);

      let width = 456;
      spyOn(view['templateWidthHook_'], 'get').and.returnValue(width);

      let assetType = Mocks.object('assetType');
      view['assetType_'] = assetType;

      let assetId = 'assetId';
      mockAssetCollection.reserveId.and.returnValue(Promise.resolve(assetId));

      await view['onSubmitAction_']();
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

      spyOn(view['nameValueHook_'], 'get').and.returnValue('assetName');
      spyOn(view['templateHeightHook_'], 'get').and.returnValue(123);
      spyOn(view['templateWidthHook_'], 'get').and.returnValue(456);

      let assetType = Mocks.object('assetType');
      view['assetType_'] = assetType;

      await view['onSubmitAction_']();
      assert(mockRouteService.goTo).toNot.haveBeenCalled();
      assert(view['reset_']).toNot.haveBeenCalled();

      assert(mockAssetCollection.update).toNot.haveBeenCalled();
    });

    it('should reject if project name is not set', async (done: any) => {
      spyOn(view['nameValueHook_'], 'get').and.returnValue(null);

      try {
        await view['onSubmitAction_']();
        done.fail();
      } catch (e) {
        const error: Error = e;
        assert(error.message).to.equal(Matchers.stringMatching(/Project name/));
      }
    });

    it('should reject if the asset type is not set', async (done: any) => {
      let assetName = 'assetName';
      spyOn(view['nameValueHook_'], 'get').and.returnValue(assetName);

      view['assetType_'] = null;

      try {
        await view['onSubmitAction_']();
        done.fail();
      } catch (e) {
        const error: Error = e;
        assert(error.message).to.equal(Matchers.stringMatching(/Asset type/));
      }
    });

    it('should reject if the height is null', async (done: any) => {
      spyOn(view, 'getProjectId_').and.returnValue(null);

      spyOn(view, 'reset_');

      spyOn(view['nameValueHook_'], 'get').and.returnValue('assetName');
      spyOn(view['templateHeightHook_'], 'get').and.returnValue(null);
      spyOn(view['templateWidthHook_'], 'get').and.returnValue(456);

      view['assetType_'] = Mocks.object('assetType');

      try {
        await view['onSubmitAction_']();
        done.fail();
      } catch (e) {
        const error: Error = e;
        assert(error.message).to.equal(Matchers.stringMatching(/Asset height/));
      }
    });

    it('should reject if the height is NaN', async (done: any) => {
      spyOn(view, 'getProjectId_').and.returnValue(null);

      spyOn(view, 'reset_');

      spyOn(view['nameValueHook_'], 'get').and.returnValue('assetName');
      spyOn(view['templateHeightHook_'], 'get').and.returnValue(NaN);
      spyOn(view['templateWidthHook_'], 'get').and.returnValue(456);

      view['assetType_'] = Mocks.object('assetType');

      try {
        await view['onSubmitAction_']();
        done.fail();
      } catch (e) {
        const error: Error = e;
        assert(error.message).to.equal(Matchers.stringMatching(/Asset height/));
      }
    });

    it('should reject if the width is null', async (done: any) => {
      spyOn(view, 'getProjectId_').and.returnValue(null);

      spyOn(view, 'reset_');

      spyOn(view['nameValueHook_'], 'get').and.returnValue('assetName');
      spyOn(view['templateHeightHook_'], 'get').and.returnValue(123);
      spyOn(view['templateWidthHook_'], 'get').and.returnValue(null);

      view['assetType_'] = Mocks.object('assetType');

      try {
        await view['onSubmitAction_']();
        done.fail();
      } catch (e) {
        const error: Error = e;
        assert(error.message).to.equal(Matchers.stringMatching(/Asset width/));
      }
    });

    it('should reject if the width is NaN', async (done: any) => {
      spyOn(view, 'getProjectId_').and.returnValue(null);

      spyOn(view, 'reset_');

      spyOn(view['nameValueHook_'], 'get').and.returnValue('assetName');
      spyOn(view['templateHeightHook_'], 'get').and.returnValue(123);
      spyOn(view['templateWidthHook_'], 'get').and.returnValue(NaN);

      view['assetType_'] = Mocks.object('assetType');

      try {
        await view['onSubmitAction_']();
        done.fail();
      } catch (e) {
        const error: Error = e;
        assert(error.message).to.equal(Matchers.stringMatching(/Asset width/));
      }
    });
  });

  describe('onPresetClicked', () => {
    it('should set the type correctly', () => {
      let stringType = 'game_crafter_deck_poker';
      let mockTarget = jasmine.createSpyObj('Target', ['getAttribute']);
      mockTarget.getAttribute.and.returnValue(stringType);

      spyOn(view, 'setPresetType_');

      view.onPresetClicked(<any> {target: mockTarget});

      assert(view['setPresetType_']).to.haveBeenCalledWith(PresetType.GAME_CRAFTER_DECK_POKER);
      assert(mockTarget.getAttribute).to.haveBeenCalledWith('gs-value');
    });
  });

  describe('onTypeClicked', () => {
    it('should set the type correctly', () => {
      let stringType = 'card';
      let mockTarget = jasmine.createSpyObj('Target', ['getAttribute']);
      mockTarget.getAttribute.and.returnValue(stringType);

      spyOn(view, 'setAssetType_');

      view.onTypeClicked(<any> {target: mockTarget});

      assert(view['setAssetType_']).to.haveBeenCalledWith(AssetType.CARD);
      assert(mockTarget.getAttribute).to.haveBeenCalledWith('gs-value');
    });
  });
});

import { assert, Matchers, TestBase } from '../test-base';
TestBase.setup();

import { DomEvent, ListenableDom } from 'external/gs_tools/src/event';
import { Mocks } from 'external/gs_tools/src/mock';
import { EnumParser } from 'external/gs_tools/src/parse';
import { TestDispose } from 'external/gs_tools/src/testing';

import { ASSET_PRESETS, PresetType, Render } from '../asset/asset-presets';
import {
  ASSET_MAP_,
  ASSET_TYPE_MENU_DATA_HELPER,
  Editor,
  PRESET_TYPE_MENU_DATA_HELPER,
} from '../asset/editor';
import { Asset, AssetType } from '../data/asset';


describe('ASSET_TYPE_MENU_DATA_HELPER', () => {
  describe('create', () => {
    it('should create the element correctly and listen to the click event', () => {
      const mockInstance = jasmine.createSpyObj(
          'Instance', ['addDisposable', 'listenTo', 'onTypeClicked']);

      const listenableElement = Mocks.object('listenableElement');
      spyOn(ListenableDom, 'of').and.returnValue(listenableElement);

      const element = Mocks.object('element');
      const mockDocument = jasmine.createSpyObj('Document', ['createElement']);
      mockDocument.createElement.and.returnValue(element);

      assert(ASSET_TYPE_MENU_DATA_HELPER.create(mockDocument, mockInstance)).to.equal(element);
      assert(mockInstance.listenTo).to
          .haveBeenCalledWith(listenableElement, DomEvent.CLICK, mockInstance.onTypeClicked);
      assert(mockInstance.addDisposable).to.haveBeenCalledWith(listenableElement);
      assert(ListenableDom.of).to.haveBeenCalledWith(element);
      assert(mockDocument.createElement).to.haveBeenCalledWith('gs-menu-item');
    });
  });

  describe('get', () => {
    it('should return the correct AssetType', () => {
      const assetType = AssetType.CARD;
      const mockElement = jasmine.createSpyObj('Element', ['getAttribute']);
      mockElement.getAttribute.and.returnValue(EnumParser(AssetType).stringify(assetType));
      assert(ASSET_TYPE_MENU_DATA_HELPER.get(mockElement)).to.equal(assetType);
      assert(mockElement.getAttribute).to.haveBeenCalledWith('gs-value');
    });

    it('should return null if there are no gs-value attributes', () => {
      const mockElement = jasmine.createSpyObj('Element', ['getAttribute']);
      mockElement.getAttribute.and.returnValue(null);
      assert(ASSET_TYPE_MENU_DATA_HELPER.get(mockElement)).to.beNull();
    });
  });

  describe('set', () => {
    it('should set the attribute correctly', () => {
      const renderedAsset = 'renderedAsset';
      spyOn(Asset, 'renderType').and.returnValue(renderedAsset);

      const mockElement = jasmine.createSpyObj('Element', ['setAttribute']);

      ASSET_TYPE_MENU_DATA_HELPER.set(AssetType.CARD, mockElement, Mocks.object('instance'));

      assert(mockElement.setAttribute).to.haveBeenCalledWith('gs-value', 'card');
      assert(mockElement.setAttribute).to.haveBeenCalledWith('gs-content', renderedAsset);
      assert(Asset.renderType).to.haveBeenCalledWith(AssetType.CARD);
    });
  });
});


describe('PRESET_TYPE_MENU_DATA_HELPER', () => {
  describe('create', () => {
    it('should create the element correctly and listen to the click event', () => {
      const mockInstance = jasmine.createSpyObj(
          'Instance', ['addDisposable', 'listenTo', 'onPresetClicked']);

      const listenableElement = Mocks.object('listenableElement');
      spyOn(ListenableDom, 'of').and.returnValue(listenableElement);

      const element = Mocks.object('element');
      const mockDocument = jasmine.createSpyObj('Document', ['createElement']);
      mockDocument.createElement.and.returnValue(element);

      assert(PRESET_TYPE_MENU_DATA_HELPER.create(mockDocument, mockInstance)).to.equal(element);
      assert(mockInstance.listenTo).to
          .haveBeenCalledWith(listenableElement, DomEvent.CLICK, mockInstance.onPresetClicked);
      assert(mockInstance.addDisposable).to.haveBeenCalledWith(listenableElement);
      assert(ListenableDom.of).to.haveBeenCalledWith(element);
      assert(mockDocument.createElement).to.haveBeenCalledWith('gs-menu-item');
    });
  });

  describe('get', () => {
    it('should return the correct PresetType', () => {
      const presetType = PresetType.GAME_CRAFTER_DECK_POKER;
      const mockElement = jasmine.createSpyObj('Element', ['getAttribute']);
      mockElement.getAttribute.and.returnValue(EnumParser(PresetType).stringify(presetType));
      assert(PRESET_TYPE_MENU_DATA_HELPER.get(mockElement)).to.equal(presetType);
      assert(mockElement.getAttribute).to.haveBeenCalledWith('gs-value');
    });

    it('should return null if there are no gs-value attributes', () => {
      const mockElement = jasmine.createSpyObj('Element', ['getAttribute']);
      mockElement.getAttribute.and.returnValue(null);
      assert(PRESET_TYPE_MENU_DATA_HELPER.get(mockElement)).to.beNull();
    });
  });

  describe('set', () => {
    it('should set the attributes correctly', () => {
      const renderedPreset = 'renderedPreset';
      spyOn(Render, 'preset').and.returnValue(renderedPreset);

      const mockElement = jasmine.createSpyObj('Element', ['setAttribute']);

      PRESET_TYPE_MENU_DATA_HELPER.set(
          PresetType.GAME_CRAFTER_DECK_POKER,
          mockElement,
          Mocks.object('instance'));

      assert(mockElement.setAttribute).to.haveBeenCalledWith('gs-value', 'game_crafter_deck_poker');
      assert(mockElement.setAttribute).to.haveBeenCalledWith('gs-content', renderedPreset);
      assert(Render.preset).to.haveBeenCalledWith(PresetType.GAME_CRAFTER_DECK_POKER);
    });
  });
});


describe('asset.Editor', () => {
  let editor: Editor;

  beforeEach(() => {
    editor = new Editor(jasmine.createSpyObj('ThemeService', ['applyTheme']));
    TestDispose.add(editor);
  });

  describe('onCreated', () => {
    it('should initialize the asset type menu correctly', () => {
      const element = Mocks.object('element');
      spyOn(editor.assetTypeMenuHook_, 'set');
      editor.onCreated(element);
      assert(editor.assetTypeMenuHook_.set).to.haveBeenCalledWith([AssetType.CARD]);
    });
  });

  describe('onAssetTypeExportChanged_', () => {
    it('should set the asset correctly', () => {
      const assetType = Mocks.object('assetType');
      spyOn(editor.assetTypeExportHook_, 'get').and.returnValue(assetType);
      spyOn(editor, 'setAssetType_');
      editor.onAssetTypeExportChanged_();
      assert(editor['setAssetType_']).to.haveBeenCalledWith(assetType);
    });

    it('should do nothing if the asset type does not change', () => {
      const assetType = Mocks.object('assetType');
      spyOn(editor.assetTypeExportHook_, 'get').and.returnValue(assetType);
      spyOn(editor, 'setAssetType_');
      editor.onAssetTypeExportChanged_();
      assert(editor['setAssetType_']).to.haveBeenCalledWith(assetType);
    });
  });

  describe('onHeightChanged_', () => {
    it('should update the export height correctly', () => {
      const height = 123;
      spyOn(editor.templateHeightHook_, 'get').and.returnValue(height);
      spyOn(editor.templateHeightExportHook_, 'get').and.returnValue(456);
      spyOn(editor.templateHeightExportHook_, 'set');
      editor.onHeightChanged_();
      assert(editor.templateHeightExportHook_.set).to.haveBeenCalledWith(height);
    });

    it('should delete the export value if height is null', () => {
      spyOn(editor.templateHeightHook_, 'get').and.returnValue(null);
      spyOn(editor.templateHeightExportHook_, 'get').and.returnValue(456);
      spyOn(editor.templateHeightExportHook_, 'delete');
      editor.onHeightChanged_();
      assert(editor.templateHeightExportHook_.delete).to.haveBeenCalledWith();
    });

    it('should do nothing if the export height is already up to date', () => {
      const height = 123;
      spyOn(editor.templateHeightHook_, 'get').and.returnValue(height);
      spyOn(editor.templateHeightExportHook_, 'get').and.returnValue(height);
      spyOn(editor.templateHeightExportHook_, 'delete');
      spyOn(editor.templateHeightExportHook_, 'set');
      editor.onHeightChanged_();
      assert(editor.templateHeightExportHook_.set).toNot.haveBeenCalled();
      assert(editor.templateHeightExportHook_.delete).toNot.haveBeenCalled();
    });
  });

  describe('onHeightExportChanged_', () => {
    it('should update the height correctly', () => {
      const height = 123;
      spyOn(editor.templateHeightExportHook_, 'get').and.returnValue(height);
      spyOn(editor.templateHeightHook_, 'get').and.returnValue(456);
      spyOn(editor.templateHeightHook_, 'set');
      editor.onHeightExportChanged_();
      assert(editor.templateHeightHook_.set).to.haveBeenCalledWith(height);
    });

    it('should delete the height if the new height is null', () => {
      spyOn(editor.templateHeightExportHook_, 'get').and.returnValue(null);
      spyOn(editor.templateHeightHook_, 'get').and.returnValue(456);
      spyOn(editor.templateHeightHook_, 'delete');
      editor.onHeightExportChanged_();
      assert(editor.templateHeightHook_.delete).to.haveBeenCalledWith();
    });

    it('should do nothing if the height is already up to date', () => {
      const height = 123;
      spyOn(editor.templateHeightExportHook_, 'get').and.returnValue(height);
      spyOn(editor.templateHeightHook_, 'get').and.returnValue(height);
      spyOn(editor.templateHeightHook_, 'delete');
      spyOn(editor.templateHeightHook_, 'set');
      editor.onHeightExportChanged_();
      assert(editor.templateHeightHook_.set).toNot.haveBeenCalled();
      assert(editor.templateHeightHook_.delete).toNot.haveBeenCalled();
    });
  });

  describe('onNameChanged_', () => {
    it('should update the export name correctly', () => {
      const name = 'name';
      spyOn(editor.nameValueHook_, 'get').and.returnValue(name);
      spyOn(editor.nameExportHook_, 'get').and.returnValue('otherName');
      spyOn(editor.nameExportHook_, 'set');
      editor.onNameChanged_();
      assert(editor.nameExportHook_.set).to.haveBeenCalledWith(name);
    });

    it('should delete the export value if name is null', () => {
      spyOn(editor.nameValueHook_, 'get').and.returnValue(null);
      spyOn(editor.nameExportHook_, 'get').and.returnValue('name');
      spyOn(editor.nameExportHook_, 'delete');
      editor.onNameChanged_();
      assert(editor.nameExportHook_.delete).to.haveBeenCalledWith();
    });

    it('should do nothing if the export name is already up to date', () => {
      const name = 'name';
      spyOn(editor.nameValueHook_, 'get').and.returnValue(name);
      spyOn(editor.nameExportHook_, 'get').and.returnValue(name);
      spyOn(editor.nameExportHook_, 'delete');
      spyOn(editor.nameExportHook_, 'set');
      editor.onNameChanged_();
      assert(editor.nameExportHook_.set).toNot.haveBeenCalled();
      assert(editor.nameExportHook_.delete).toNot.haveBeenCalled();
    });
  });

  describe('onNameExportChanged_', () => {
    it('should update the name correctly', () => {
      const name = 'name';
      spyOn(editor.nameExportHook_, 'get').and.returnValue(name);
      spyOn(editor.nameValueHook_, 'get').and.returnValue('otherName');
      spyOn(editor.nameValueHook_, 'set');
      editor.onNameExportChanged_();
      assert(editor.nameValueHook_.set).to.haveBeenCalledWith(name);
    });

    it('should delete the name if the new name is null', () => {
      spyOn(editor.nameExportHook_, 'get').and.returnValue(null);
      spyOn(editor.nameValueHook_, 'get').and.returnValue('name');
      spyOn(editor.nameValueHook_, 'delete');
      editor.onNameExportChanged_();
      assert(editor.nameValueHook_.delete).to.haveBeenCalledWith();
    });

    it('should do nothing if the name is already up to date', () => {
      const name = 'name';
      spyOn(editor.nameExportHook_, 'get').and.returnValue(name);
      spyOn(editor.nameValueHook_, 'get').and.returnValue(name);
      spyOn(editor.nameValueHook_, 'delete');
      spyOn(editor.nameValueHook_, 'set');
      editor.onNameExportChanged_();
      assert(editor.nameValueHook_.set).toNot.haveBeenCalled();
      assert(editor.nameValueHook_.delete).toNot.haveBeenCalled();
    });
  });

  describe('onPresetClicked', () => {
    it('should set the type correctly', () => {
      const stringType = 'game_crafter_deck_poker';
      const mockTarget = jasmine.createSpyObj('Target', ['getAttribute']);
      mockTarget.getAttribute.and.returnValue(stringType);

      spyOn(editor, 'setPresetType_');

      editor.onPresetClicked(<any> {target: mockTarget});

      assert(editor['setPresetType_']).to.haveBeenCalledWith(PresetType.GAME_CRAFTER_DECK_POKER);
      assert(mockTarget.getAttribute).to.haveBeenCalledWith('gs-value');
    });
  });

  describe('onTypeClicked', () => {
    it('should set the type correctly', () => {
      const stringType = 'card';
      const mockTarget = jasmine.createSpyObj('Target', ['getAttribute']);
      mockTarget.getAttribute.and.returnValue(stringType);

      spyOn(editor, 'setAssetType_');

      editor.onTypeClicked(<any> {target: mockTarget});

      assert(editor['setAssetType_']).to.haveBeenCalledWith(AssetType.CARD);
      assert(mockTarget.getAttribute).to.haveBeenCalledWith('gs-value');
    });
  });

  describe('onWidthChanged_', () => {
    it('should update the export width correctly', () => {
      const width = 123;
      spyOn(editor.templateWidthHook_, 'get').and.returnValue(width);
      spyOn(editor.templateWidthExportHook_, 'get').and.returnValue(456);
      spyOn(editor.templateWidthExportHook_, 'set');
      editor.onWidthChanged_();
      assert(editor.templateWidthExportHook_.set).to.haveBeenCalledWith(width);
    });

    it('should delete the export value if width is null', () => {
      spyOn(editor.templateWidthHook_, 'get').and.returnValue(null);
      spyOn(editor.templateWidthExportHook_, 'get').and.returnValue(123);
      spyOn(editor.templateWidthExportHook_, 'delete');
      editor.onWidthChanged_();
      assert(editor.templateWidthExportHook_.delete).to.haveBeenCalledWith();
    });

    it('should do nothing if the export width is already up to date', () => {
      const width = 123;
      spyOn(editor.templateWidthHook_, 'get').and.returnValue(width);
      spyOn(editor.templateWidthExportHook_, 'get').and.returnValue(width);
      spyOn(editor.templateWidthExportHook_, 'delete');
      spyOn(editor.templateWidthExportHook_, 'set');
      editor.onWidthChanged_();
      assert(editor.templateWidthExportHook_.set).toNot.haveBeenCalled();
      assert(editor.templateWidthExportHook_.delete).toNot.haveBeenCalled();
    });
  });

  describe('onWidthExportChanged_', () => {
    it('should update the width correctly', () => {
      const width = 123;
      spyOn(editor.templateWidthExportHook_, 'get').and.returnValue(width);
      spyOn(editor.templateWidthHook_, 'get').and.returnValue(456);
      spyOn(editor.templateWidthHook_, 'set');
      editor.onWidthExportChanged_();
      assert(editor.templateWidthHook_.set).to.haveBeenCalledWith(width);
    });

    it('should delete the width if the new width is null', () => {
      spyOn(editor.templateWidthExportHook_, 'get').and.returnValue(null);
      spyOn(editor.templateWidthHook_, 'get').and.returnValue(123);
      spyOn(editor.templateWidthHook_, 'delete');
      editor.onWidthExportChanged_();
      assert(editor.templateWidthHook_.delete).to.haveBeenCalledWith();
    });

    it('should do nothing if the width is already up to date', () => {
      const width = 123;
      spyOn(editor.templateWidthExportHook_, 'get').and.returnValue(width);
      spyOn(editor.templateWidthHook_, 'get').and.returnValue(width);
      spyOn(editor.templateWidthHook_, 'delete');
      spyOn(editor.templateWidthHook_, 'set');
      editor.onWidthExportChanged_();
      assert(editor.templateWidthHook_.set).toNot.haveBeenCalled();
      assert(editor.templateWidthHook_.delete).toNot.haveBeenCalled();
    });
  });

  describe('setAssetType_', () => {
    it('should set the hook correctly if the type is non null', () => {
      const renderedType = 'renderedType';
      spyOn(Asset, 'renderType').and.returnValue(renderedType);

      const assetType = Mocks.object('assetType');

      spyOn(editor, 'updateTemplateSection_');
      spyOn(editor.assetTypeHook_, 'set');
      spyOn(editor.assetTypeExportHook_, 'set');

      editor['setAssetType_'](assetType);

      assert(editor.assetTypeHook_.set).to.haveBeenCalledWith(renderedType);
      assert(editor.assetTypeExportHook_.set).to.haveBeenCalledWith(assetType);
      assert(editor['updateTemplateSection_']).to.haveBeenCalledWith();
      assert(Asset.renderType).to.haveBeenCalledWith(assetType);
    });

    it('should set the hook correctly if the type is null', () => {
      spyOn(editor, 'updateTemplateSection_');
      spyOn(editor.assetTypeHook_, 'set');
      spyOn(editor.assetTypeExportHook_, 'delete');

      editor['setAssetType_'](null);

      assert(editor['updateTemplateSection_']).to.haveBeenCalledWith();
      assert(editor.assetTypeHook_.set).to
          .haveBeenCalledWith(Matchers.stringMatching(/Select a type/));
      assert(editor.assetTypeExportHook_.delete).to.haveBeenCalledWith();
    });
  });

  describe('setPresetType_', () => {
    it('should set the preset correctly', () => {
      const presetType = PresetType.GAME_CRAFTER_DECK_SQUARE;
      const renderedPreset = 'renderedPreset';
      spyOn(Render, 'preset').and.returnValue(renderedPreset);

      const height = 123;
      const width = 456;
      const presetObj = {heightPx: height, widthPx: width};
      spyOn(ASSET_PRESETS, 'get').and.returnValue(presetObj);

      spyOn(editor['presetTypeHook_'], 'set');
      spyOn(editor['templateHeightHook_'], 'set');
      spyOn(editor['templateWidthHook_'], 'set');

      editor['setPresetType_'](presetType);

      assert(editor['templateHeightHook_'].set).to.haveBeenCalledWith(height);
      assert(editor['templateWidthHook_'].set).to.haveBeenCalledWith(width);
      assert(ASSET_PRESETS.get).to.haveBeenCalledWith(presetType);
      assert(editor['presetTypeHook_'].set).to.haveBeenCalledWith(renderedPreset);
      assert(editor['presetType_']).to.equal(presetType);
    });

    it('should handle where there are no corresponding preset object', () => {
      const presetType = PresetType.GAME_CRAFTER_DECK_SQUARE;
      spyOn(Render, 'preset').and.returnValue('renderedPreset');

      spyOn(ASSET_PRESETS, 'get').and.returnValue(undefined);

      spyOn(editor['presetTypeHook_'], 'set');
      spyOn(editor['templateHeightHook_'], 'set');
      spyOn(editor['templateWidthHook_'], 'set');

      editor['setPresetType_'](presetType);

      assert(editor['templateHeightHook_'].set).toNot.haveBeenCalled();
      assert(editor['templateWidthHook_'].set).toNot.haveBeenCalled();
      assert(editor['presetType_']).to.equal(presetType);
    });

    it('should handle the case where the preset type is null', () => {
      spyOn(ASSET_PRESETS, 'get').and.returnValue(undefined);

      spyOn(editor['presetTypeHook_'], 'set');
      spyOn(editor['templateHeightHook_'], 'set');
      spyOn(editor['templateWidthHook_'], 'set');

      editor['setPresetType_'](null);

      assert(editor['templateHeightHook_'].set).toNot.haveBeenCalled();
      assert(editor['templateWidthHook_'].set).toNot.haveBeenCalled();
      assert(editor['presetTypeHook_'].set).to
          .haveBeenCalledWith(Matchers.stringMatching(/Select/));
      assert(editor['presetType_']).to.beNull();
    });
  });

  describe('updateTemplateSection_', () => {
    it('should set the class and presets correctly, and verify inputs', () => {
      spyOn(editor['templateSectionHiddenHook_'], 'set');

      spyOn(editor['presetTypeMenuHook_'], 'set');
      spyOn(editor['presetTypeHook_'], 'set');

      const presetSet = Mocks.object('presetSet');
      spyOn(ASSET_MAP_, 'get').and.returnValue(presetSet);

      const assetType = AssetType.CARD;
      editor['assetType_'] = assetType;

      editor['updateTemplateSection_']();

      assert(editor['templateSectionHiddenHook_'].set).to.haveBeenCalledWith(false);
      assert(editor['presetTypeMenuHook_'].set).to.haveBeenCalledWith(presetSet);
      assert(editor['presetTypeHook_'].set).to.haveBeenCalledWith('');
      assert(ASSET_MAP_.get).to.haveBeenCalledWith(assetType);
    });

    it('should set the class and presets correctly if there are no asset types', () => {
      spyOn(editor['templateSectionHiddenHook_'], 'set');

      spyOn(editor['presetTypeMenuHook_'], 'set');
      spyOn(editor['presetTypeHook_'], 'set');

      editor['assetType_'] = null;

      editor['updateTemplateSection_']();

      assert(editor['templateSectionHiddenHook_'].set).to.haveBeenCalledWith(true);
      assert(editor['presetTypeMenuHook_'].set).to.haveBeenCalledWith([]);
      assert(editor['presetTypeHook_'].set).to.haveBeenCalledWith('');
    });
  });
});

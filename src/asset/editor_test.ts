import { assert, Matchers, TestBase } from '../test-base';
TestBase.setup();

import { FakeMonadSetter, MonadUtil } from 'external/gs_tools/src/event';
import { Mocks } from 'external/gs_tools/src/mock';
import { EnumParser } from 'external/gs_tools/src/parse';
import { TestDispose } from 'external/gs_tools/src/testing';

import { ImmutableList } from 'external/gs_tools/src/immutable';
import { ASSET_PRESETS, PresetType, Render } from '../asset/asset-presets';
import {
  ASSET_MAP_,
  ASSET_TYPE_MENU_CHILDREN,
  Editor,
  MENU_ITEM_VALUE_ATTR,
  PRESET_TYPE_MENU_CHILDREN,
} from '../asset/editor';
import { Asset2, AssetType } from '../data/asset2';


describe('ASSET_TYPE_MENU_CHILDREN', () => {
  describe('create', () => {
    it('should create the element correctly', () => {
      const instance = Mocks.object('instance');

      const element = Mocks.object('element');
      const mockDocument = jasmine.createSpyObj('Document', ['createElement']);
      mockDocument.createElement.and.returnValue(element);

      assert(ASSET_TYPE_MENU_CHILDREN.bridge.create(mockDocument, instance)).to.equal(element);
      assert(mockDocument.createElement).to.haveBeenCalledWith('gs-menu-item');
    });
  });

  describe('get', () => {
    it('should return the correct AssetType', () => {
      const assetType = AssetType.CARD;
      const element = document.createElement('div');
      element.setAttribute(MENU_ITEM_VALUE_ATTR, EnumParser(AssetType).stringify(assetType));

      assert(ASSET_TYPE_MENU_CHILDREN.bridge.get(element)).to.equal(assetType);
    });

    it('should return null if there are no value attributes', () => {
      const element = document.createElement('div');

      assert(ASSET_TYPE_MENU_CHILDREN.bridge.get(element)).to.beNull();
    });
  });

  describe('set', () => {
    it('should set the attribute correctly', () => {
      const renderedAsset = 'renderedAsset';
      spyOn(Asset2, 'renderType').and.returnValue(renderedAsset);

      const element = document.createElement('div');

      ASSET_TYPE_MENU_CHILDREN.bridge.set(AssetType.CARD, element, Mocks.object('instance'));
      assert(element.getAttribute(MENU_ITEM_VALUE_ATTR)).to.equal('card');
      assert(element.getAttribute('content')).to.equal(renderedAsset);
      assert(Asset2.renderType).to.haveBeenCalledWith(AssetType.CARD);
    });
  });
});


describe('PRESET_TYPE_MENU_CHILDREN', () => {
  describe('create', () => {
    it('should create the element correctly and listen to the click event', () => {
      const instance = Mocks.object('instance');

      const element = Mocks.object('element');
      const mockDocument = jasmine.createSpyObj('Document', ['createElement']);
      mockDocument.createElement.and.returnValue(element);

      assert(PRESET_TYPE_MENU_CHILDREN.bridge.create(mockDocument, instance)).to.equal(element);
      assert(mockDocument.createElement).to.haveBeenCalledWith('gs-menu-item');
    });
  });

  describe('get', () => {
    it('should return the correct PresetType', () => {
      const presetType = PresetType.GAME_CRAFTER_DECK_POKER;
      const element = document.createElement('div');
      element.setAttribute(MENU_ITEM_VALUE_ATTR, EnumParser(PresetType).stringify(presetType));

      assert(PRESET_TYPE_MENU_CHILDREN.bridge.get(element)).to.equal(presetType);
    });

    it('should return null if there are no gs-value attributes', () => {
      const mockElement = jasmine.createSpyObj('Element', ['getAttribute']);
      mockElement.getAttribute.and.returnValue(null);
      assert(PRESET_TYPE_MENU_CHILDREN.bridge.get(mockElement)).to.beNull();
    });
  });

  describe('set', () => {
    it('should set the attributes correctly', () => {
      const renderedPreset = 'renderedPreset';
      spyOn(Render, 'preset').and.returnValue(renderedPreset);

      const element = document.createElement('div');

      PRESET_TYPE_MENU_CHILDREN.bridge.set(
          PresetType.GAME_CRAFTER_DECK_POKER,
          element,
          Mocks.object('instance'));
      assert(element.getAttribute(MENU_ITEM_VALUE_ATTR)).to.equal('game_crafter_deck_poker');
      assert(element.getAttribute('content')).to.equal(renderedPreset);
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

  describe('onAssetTypeExportChanged_', () => {
    it('should set the asset correctly', () => {
      const assetType = Mocks.object('assetType');
      spyOn(MonadUtil, 'callFunction');

      editor.onAssetTypeExportChanged_(assetType);
      assert(MonadUtil.callFunction).to.haveBeenCalledWith(
          Matchers.objectContaining({assetType}),
          editor,
          'setAssetType_');
    });
  });

  describe('onCreated', () => {
    it('should initialize the asset type menu correctly', () => {
      const fakeAssetTypeMenuChildrenSetter =
          new FakeMonadSetter<ImmutableList<AssetType>>(ImmutableList.of([]));

      const updates = editor.onCreated(fakeAssetTypeMenuChildrenSetter);
      assert(fakeAssetTypeMenuChildrenSetter.findValue(updates)!.value).to
          .haveElements([AssetType.CARD]);
    });
  });

  describe('onHeightChanged_', () => {
    it('should update the export height correctly', () => {
      const height = 123;
      const fakeHeightSetter = new FakeMonadSetter<number | null>(null);

      const updates = editor.onHeightChanged_(height, fakeHeightSetter);
      assert(fakeHeightSetter.findValue(updates)!.value).to.equal(height);
    });

    it('should do nothing if the export height is already up to date', () => {
      const height = 123;
      const fakeHeightSetter = new FakeMonadSetter<number | null>(height);

      const updates = editor.onHeightChanged_(height, fakeHeightSetter);
      assert([...updates]).to.equal([]);
    });
  });

  describe('onHeightExportChanged_', () => {
    it('should update the height correctly', () => {
      const height = 123;
      const fakeInputHeightSetter = new FakeMonadSetter<number | null>(null);

      const updates = editor.onHeightExportChanged_(fakeInputHeightSetter, height);
      assert(fakeInputHeightSetter.findValue(updates)!.value).to.equal(height);
    });

    it('should do nothing if the height is already up to date', () => {
      const height = 123;
      const fakeInputHeightSetter = new FakeMonadSetter<number | null>(height);

      const updates = editor.onHeightExportChanged_(fakeInputHeightSetter, height);
      assert([...updates]).to.equal([]);
    });
  });

  describe('onNameChanged_', () => {
    it('should update the export name correctly', () => {
      const name = 'name';
      const fakeNameSetter = new FakeMonadSetter<string | null>(null);

      const updates = editor.onNameChanged_(name, fakeNameSetter);
      assert(fakeNameSetter.findValue(updates)!.value).to.equal(name);
    });

    it('should do nothing if the export name is already up to date', () => {
      const name = 'name';
      const fakeNameSetter = new FakeMonadSetter<string | null>(name);

      const updates = editor.onNameChanged_(name, fakeNameSetter);
      assert([...updates]).to.equal([]);
    });
  });

  describe('onNameExportChanged_', () => {
    it('should update the name correctly', () => {
      const name = 'name';
      const fakeNameInputSetter = new FakeMonadSetter<string | null>(null);

      const updates = editor.onNameExportChanged_(fakeNameInputSetter, name);
      assert(fakeNameInputSetter.findValue(updates)!.value).to.equal(name);
    });

    it('should do nothing if the name is already up to date', () => {
      const name = 'name';
      const fakeNameInputSetter = new FakeMonadSetter<string | null>(name);

      const updates = editor.onNameExportChanged_(fakeNameInputSetter, name);
      assert([...updates]).to.equal([]);
    });
  });

  describe('onPresetClicked', () => {
    it('should set the type correctly', () => {
      const presetType = PresetType.GAME_CRAFTER_DECK_POKER;

      const height = ASSET_PRESETS.get(presetType)!.heightPx;
      const width = ASSET_PRESETS.get(presetType)!.widthPx;

      const renderedPreset = 'renderedPreset';
      spyOn(Render, 'preset').and.returnValue(renderedPreset);

      const stringType = 'game_crafter_deck_poker';
      const target = document.createElement('div');
      target.setAttribute(MENU_ITEM_VALUE_ATTR, stringType);

      const fakePresetTypeInnerTextSetter = new FakeMonadSetter<string | null>(null);
      const fakeTemplateHeightSetter = new FakeMonadSetter<number | null>(null);
      const fakeTemplateWidthSetter = new FakeMonadSetter<number | null>(null);
      const fakePresetTypeMenuVisibleSetter = new FakeMonadSetter<boolean | null>(null);

      const updates = editor.onPresetClicked(
          {target} as any,
          fakePresetTypeInnerTextSetter,
          fakeTemplateHeightSetter,
          fakeTemplateWidthSetter,
          fakePresetTypeMenuVisibleSetter);
      assert(fakeTemplateWidthSetter.findValue(updates)!.value).to.equal(width);
      assert(fakeTemplateHeightSetter.findValue(updates)!.value).to.equal(height);
      assert(fakePresetTypeInnerTextSetter.findValue(updates)!.value).to.equal(renderedPreset);
      assert(Render.preset).to.haveBeenCalledWith(presetType);
      assert(fakePresetTypeMenuVisibleSetter.findValue(updates)!.value).to.beFalse();
    });

    it('should handle where there are no corresponding preset object', () => {
      const presetType = PresetType.GAME_CRAFTER_DECK_POKER;
      spyOn(ASSET_PRESETS, 'get').and.returnValue(null);

      const renderedPreset = 'renderedPreset';
      spyOn(Render, 'preset').and.returnValue(renderedPreset);

      const stringType = 'game_crafter_deck_poker';
      const target = document.createElement('div');
      target.setAttribute(MENU_ITEM_VALUE_ATTR, stringType);

      const fakePresetTypeInnerTextSetter = new FakeMonadSetter<string | null>(null);
      const fakeTemplateHeightSetter = new FakeMonadSetter<number | null>(null);
      const fakeTemplateWidthSetter = new FakeMonadSetter<number | null>(null);
      const fakePresetTypeMenuVisibleSetter = new FakeMonadSetter<boolean | null>(null);

      const updates = editor.onPresetClicked(
          {target} as any,
          fakePresetTypeInnerTextSetter,
          fakeTemplateHeightSetter,
          fakeTemplateWidthSetter,
          fakePresetTypeMenuVisibleSetter);
      assert(fakeTemplateWidthSetter.findValue(updates)).to.beNull();
      assert(fakeTemplateHeightSetter.findValue(updates)).to.beNull();
      assert(fakePresetTypeInnerTextSetter.findValue(updates)!.value).to.equal(renderedPreset);
      assert(Render.preset).to.haveBeenCalledWith(presetType);
      assert(fakePresetTypeMenuVisibleSetter.findValue(updates)!.value).to.beFalse();
    });

    it('should handle the case where the preset type is null', () => {
      spyOn(ASSET_PRESETS, 'get').and.returnValue(null);

      const target = document.createElement('div');
      target.setAttribute(MENU_ITEM_VALUE_ATTR, '');

      const fakePresetTypeInnerTextSetter = new FakeMonadSetter<string | null>(null);
      const fakeTemplateHeightSetter = new FakeMonadSetter<number | null>(null);
      const fakeTemplateWidthSetter = new FakeMonadSetter<number | null>(null);
      const fakePresetTypeMenuVisibleSetter = new FakeMonadSetter<boolean | null>(null);

      const updates = editor.onPresetClicked(
          {target} as any,
          fakePresetTypeInnerTextSetter,
          fakeTemplateHeightSetter,
          fakeTemplateWidthSetter,
          fakePresetTypeMenuVisibleSetter);
      assert(fakeTemplateWidthSetter.findValue(updates)).to.beNull();
      assert(fakeTemplateHeightSetter.findValue(updates)).to.beNull();
      assert(fakePresetTypeInnerTextSetter.findValue(updates)!.value).to.match(/select a preset/i);
      assert(fakePresetTypeMenuVisibleSetter.findValue(updates)!.value).to.beFalse();
    });

    it(`should do nothing if the target has no value attribute`, () => {
      const target = document.createElement('div');

      const fakePresetTypeInnerTextSetter = new FakeMonadSetter<string | null>(null);
      const fakeTemplateHeightSetter = new FakeMonadSetter<number | null>(null);
      const fakeTemplateWidthSetter = new FakeMonadSetter<number | null>(null);
      const fakePresetTypeMenuVisibleSetter = new FakeMonadSetter<boolean | null>(null);

      const updates = editor.onPresetClicked(
          {target} as any,
          fakePresetTypeInnerTextSetter,
          fakeTemplateHeightSetter,
          fakeTemplateWidthSetter,
          fakePresetTypeMenuVisibleSetter);
      assert([...updates]).to.equal([]);
    });
  });

  describe('onTypeClicked', () => {
    it('should set the type correctly', () => {
      const assetType = AssetType.CARD;

      const target = document.createElement('div');
      target.setAttribute(MENU_ITEM_VALUE_ATTR, 'card');
      const fakeAssetTypeMenuVisibleSetter = new FakeMonadSetter<boolean | null>(null);

      spyOn(MonadUtil, 'callFunction');

      const updates = editor.onTypeClicked({target} as any, fakeAssetTypeMenuVisibleSetter);
      assert(fakeAssetTypeMenuVisibleSetter.findValue(updates)!.value).to.beFalse();
      assert(MonadUtil.callFunction).to.haveBeenCalledWith(
          Matchers.objectContaining({assetType}), editor, 'setAssetType_');
    });

    it(`should do nothing if the target has no value attribute`, () => {
      const target = document.createElement('div');
      const fakeAssetTypeMenuVisibleSetter = new FakeMonadSetter<boolean | null>(null);

      spyOn(MonadUtil, 'callFunction');

      const updates = editor.onTypeClicked({target} as any, fakeAssetTypeMenuVisibleSetter);
      assert([...updates]).to.equal([]);
      assert(MonadUtil.callFunction).toNot.haveBeenCalled();
    });
  });

  describe('onWidthChanged_', () => {
    it('should update the export width correctly', () => {
      const width = 123;
      const fakeWidthSetter = new FakeMonadSetter<number | null>(null);

      const updates = editor.onWidthChanged_(width, fakeWidthSetter);
      assert(fakeWidthSetter.findValue(updates)!.value).to.equal(width);
    });

    it('should do nothing if the export width is already up to date', () => {
      const width = 123;
      const fakeWidthSetter = new FakeMonadSetter<number | null>(width);

      const updates = editor.onWidthChanged_(width, fakeWidthSetter);
      assert([...updates]).to.equal([]);
    });
  });

  describe('onWidthExportChanged_', () => {
    it('should update the width correctly', () => {
      const width = 123;
      const fakeInputWidthSetter = new FakeMonadSetter<number | null>(null);

      const updates = editor.onWidthExportChanged_(fakeInputWidthSetter, width);
      assert(fakeInputWidthSetter.findValue(updates)!.value).to.equal(width);
    });

    it('should do nothing if the width is already up to date', () => {
      const width = 123;
      const fakeInputWidthSetter = new FakeMonadSetter<number | null>(width);

      const updates = editor.onWidthExportChanged_(fakeInputWidthSetter, width);
      assert([...updates]).to.equal([]);
    });
  });

  describe('setAssetType_', () => {
    it('should set the hook correctly if the type is non null', () => {
      const renderedType = 'renderedType';
      spyOn(Asset2, 'renderType').and.returnValue(renderedType);

      const assetType = AssetType.CARD;
      const fakeAssetTypeInnerTextSetter = new FakeMonadSetter<string | null>(null);
      const fakeAssetTypeSetter = new FakeMonadSetter<AssetType | null>(null);
      const fakeTemplateSectionHiddenSetter = new FakeMonadSetter<boolean | null>(null);
      const fakePresetTypeMenuSetter =
          new FakeMonadSetter<ImmutableList<PresetType>>(ImmutableList.of([]));
      const fakePresetTypeSetter = new FakeMonadSetter<string | null>(null);

      const updates = editor.setAssetType_(
          {assetType} as any,
          fakeAssetTypeInnerTextSetter,
          fakeAssetTypeSetter,
          fakeTemplateSectionHiddenSetter,
          fakePresetTypeMenuSetter,
          fakePresetTypeSetter);

      assert(fakePresetTypeMenuSetter.findValue(updates)!.value).to
          .haveElements([...ASSET_MAP_.get(assetType)!]);
      assert(fakeTemplateSectionHiddenSetter.findValue(updates)!.value).to.beFalse();
      assert(fakeAssetTypeInnerTextSetter.findValue(updates)!.value).to.equal(renderedType);
      assert(Asset2.renderType).to.haveBeenCalledWith(assetType);
      assert(fakePresetTypeSetter.findValue(updates)!.value).to.equal('');
      assert(fakeAssetTypeSetter.findValue(updates)!.value).to.equal(assetType);
    });

    it(`should set the preset type menu correctly if there are no corresponding asset types`,
        () => {
      const renderedType = 'renderedType';
      spyOn(Asset2, 'renderType').and.returnValue(renderedType);

      spyOn(ASSET_MAP_, 'get').and.returnValue(null);

      const assetType = AssetType.CARD;
      const fakeAssetTypeInnerTextSetter = new FakeMonadSetter<string | null>(null);
      const fakeAssetTypeSetter = new FakeMonadSetter<AssetType | null>(null);
      const fakeTemplateSectionHiddenSetter = new FakeMonadSetter<boolean | null>(null);
      const fakePresetTypeMenuSetter =
          new FakeMonadSetter<ImmutableList<PresetType>>(ImmutableList.of([]));
      const fakePresetTypeSetter = new FakeMonadSetter<string | null>(null);

      const updates = editor.setAssetType_(
          {assetType} as any,
          fakeAssetTypeInnerTextSetter,
          fakeAssetTypeSetter,
          fakeTemplateSectionHiddenSetter,
          fakePresetTypeMenuSetter,
          fakePresetTypeSetter);

      assert(fakePresetTypeMenuSetter.findValue(updates)!.value).to.haveElements([]);
      assert(ASSET_MAP_.get).to.haveBeenCalledWith(assetType);
      assert(fakeTemplateSectionHiddenSetter.findValue(updates)!.value).to.beFalse();
      assert(fakeAssetTypeInnerTextSetter.findValue(updates)!.value).to.equal(renderedType);
      assert(Asset2.renderType).to.haveBeenCalledWith(assetType);
      assert(fakePresetTypeSetter.findValue(updates)!.value).to.equal('');
      assert(fakeAssetTypeSetter.findValue(updates)!.value).to.equal(assetType);
    });

    it(`should reset if asset type is null`, () => {
      const assetType = null;
      const fakeAssetTypeInnerTextSetter = new FakeMonadSetter<string | null>(null);
      const fakeAssetTypeSetter = new FakeMonadSetter<AssetType | null>(null);
      const fakeTemplateSectionHiddenSetter = new FakeMonadSetter<boolean | null>(null);
      const fakePresetTypeMenuSetter =
          new FakeMonadSetter<ImmutableList<PresetType>>(ImmutableList.of([]));
      const fakePresetTypeSetter = new FakeMonadSetter<string | null>(null);

      const updates = editor.setAssetType_(
          {assetType} as any,
          fakeAssetTypeInnerTextSetter,
          fakeAssetTypeSetter,
          fakeTemplateSectionHiddenSetter,
          fakePresetTypeMenuSetter,
          fakePresetTypeSetter);

      assert(fakePresetTypeMenuSetter.findValue(updates)!.value).to.haveElements([]);
      assert(fakeTemplateSectionHiddenSetter.findValue(updates)!.value).to.beTrue();
      assert(fakeAssetTypeInnerTextSetter.findValue(updates)!.value).to.match(/select a type/i);
      assert(fakePresetTypeSetter.findValue(updates)!.value).to.equal('');
      assert(fakeAssetTypeSetter.findValue(updates)!.value).to.beNull();
    });
  });
});

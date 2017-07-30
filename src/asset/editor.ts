import { eventDetails, MonadUtil } from 'external/gs_tools/src/event';
import { inject } from 'external/gs_tools/src/inject';
import { BooleanParser, EnumParser, FloatParser, StringParser } from 'external/gs_tools/src/parse';
import {
  customElement,
  dom,
  domOut,
  onDom,
  onLifecycle} from 'external/gs_tools/src/webc';

import { ImmutableList, ImmutableMap } from 'external/gs_tools/src/immutable';
import { ChildElementsSelector, MonadSetter, MonadValue } from 'external/gs_tools/src/interfaces';
import { BaseThemedElement2 } from 'external/gs_ui/src/common';
import { ThemeService } from 'external/gs_ui/src/theming';

import { ASSET_PRESETS, PresetType, Render } from '../asset/asset-presets';
import { Asset2, AssetType } from '../data/asset2';

const ASSET_NAME_INPUT_EL = '#nameInput';
const ASSET_TYPE_EL = '#assetType';
const ASSET_TYPE_MENU_EL = '#assetTypeMenu';
const ASSET_TYPE_MENU_CONTENT_EL = '#assetTypeMenuContent';
const PRESET_TYPE_EL = '#presetType';
const PRESET_TYPE_MENU_EL = '#presetTypeMenu';
const PRESET_TYPE_MENU_CONTENT_EL = '#presetTypeMenuContent';
const HEIGHT_INPUT_EL = '#heightInput';
const TEMPLATE_SECTION_EL = '#templateSection';
const WIDTH_INPUT_EL = '#widthInput';

const ASSET_NAME_ATTR = {name: 'asset-name', parser: StringParser, selector: null};
const ASSET_NAME_INPUT_VALUE_ATTR = {
  name: 'value',
  parser: StringParser,
  selector: ASSET_NAME_INPUT_EL,
};
const ASSET_TYPE_ATTR = {name: 'asset-type', parser: EnumParser(AssetType), selector: null};
const ASSET_TYPE_MENU_VISIBLE_ATTR = {
  name: 'visible',
  parser: BooleanParser,
  selector: ASSET_TYPE_MENU_EL,
};
const HEIGHT_ATTR = {name: 'asset-height', parser: FloatParser, selector: null};
const HEIGHT_INPUT_VALUE_ATTR = {name: 'value', parser: FloatParser, selector: HEIGHT_INPUT_EL};
const PRESET_TYPE_MENU_VISIBLE_ATTR = {
  name: 'visible',
  parser: BooleanParser,
  selector: PRESET_TYPE_MENU_EL,
};
const TEMPLATE_SECTION_HIDDEN_ATTR = {
  name: 'hidden',
  parser: BooleanParser,
  selector: TEMPLATE_SECTION_EL,
};
const WIDTH_ATTR = {name: 'asset-width', parser: FloatParser, selector: null};
const WIDTH_INPUT_VALUE_ATTR = {name: 'value', parser: FloatParser, selector: WIDTH_INPUT_EL};

const ASSET_TYPE_INNER_TEXT = {parser: StringParser, selector: ASSET_TYPE_EL};
const PRESET_TYPE_INNER_TEXT = {parser: StringParser, selector: PRESET_TYPE_EL};

export const MENU_ITEM_VALUE_ATTR = 'pa-value';

export const ASSET_TYPE_MENU_CHILDREN: ChildElementsSelector<AssetType> = {
  bridge: {
    create(document: Document): Element {
      return document.createElement('gs-menu-item');
    },

    /**
     * @override
     */
    get(element: Element): AssetType | null {
      const strValue = element.getAttribute(MENU_ITEM_VALUE_ATTR);
      return strValue === null ? null : EnumParser<AssetType>(AssetType).parse(strValue);
    },

    /**
     * @override
     */
    set(data: AssetType, element: Element): void {
      element.setAttribute('content', Asset2.renderType(data));
      element.setAttribute(MENU_ITEM_VALUE_ATTR, EnumParser(AssetType).stringify(data));
    },
  },
  selector: ASSET_TYPE_MENU_CONTENT_EL,
};
export const PRESET_TYPE_MENU_CHILDREN: ChildElementsSelector<PresetType> = {
  bridge: {
    create(document: Document): Element {
      return document.createElement('gs-menu-item');
    },

    get(element: Element): PresetType | null {
      const strValue = element.getAttribute(MENU_ITEM_VALUE_ATTR);
      return strValue === null ? null : EnumParser<PresetType>(PresetType).parse(strValue);
    },

    set(data: PresetType, element: Element): void {
      element.setAttribute('content', Render.preset(data));
      element.setAttribute(MENU_ITEM_VALUE_ATTR, EnumParser(PresetType).stringify(data));
    },
  },
  selector: PRESET_TYPE_MENU_CONTENT_EL,
};


export const ASSET_MAP_: ImmutableMap<AssetType, ImmutableList<PresetType>> = ImmutableMap.of([
  [
    AssetType.CARD,
    ImmutableList.of([PresetType.GAME_CRAFTER_DECK_POKER, PresetType.GAME_CRAFTER_DECK_SQUARE]),
  ],
]);

/**
 * Asset editor.
 */
@customElement({
  tag: 'pa-asset-editor',
  templateKey: 'src/asset/editor',
})
export class Editor extends BaseThemedElement2 {
  constructor(
      @inject('theming.ThemeService') themeService: ThemeService) {
    super(themeService);
  }

  @onDom.attributeChange(ASSET_TYPE_ATTR)
  onAssetTypeExportChanged_(
      @dom.attribute(ASSET_TYPE_ATTR) assetType: AssetType | null): void {
    MonadUtil.callFunction({type: 'asset-changed', assetType}, this, 'setAssetType_');
  }

  @onLifecycle('create')
  onCreated(
      @domOut.childElements(ASSET_TYPE_MENU_CHILDREN)
          assetTypeMenuChildrenSetter: MonadSetter<ImmutableList<AssetType>>):
      Iterable<MonadValue<any>> {
    return ImmutableList.of([assetTypeMenuChildrenSetter.set(ImmutableList.of([AssetType.CARD]))]);
  }

  @onDom.attributeChange(HEIGHT_INPUT_VALUE_ATTR)
  onHeightChanged_(
      @dom.attribute(HEIGHT_INPUT_VALUE_ATTR) inputHeight: number | null,
      @domOut.attribute(HEIGHT_ATTR) heightSetter: MonadSetter<number | null>):
      Iterable<MonadValue<any>> {
    if (inputHeight === heightSetter.value) {
      return ImmutableList.of([]);
    }

    return ImmutableList.of([heightSetter.set(inputHeight)]);
  }

  @onDom.attributeChange(HEIGHT_ATTR)
  onHeightExportChanged_(
      @domOut.attribute(HEIGHT_INPUT_VALUE_ATTR) inputHeightSetter: MonadSetter<number | null>,
      @dom.attribute(HEIGHT_ATTR) height: number | null): Iterable<MonadValue<any>> {
    if (height === inputHeightSetter.value) {
      return ImmutableList.of([]);
    }
    return ImmutableList.of([inputHeightSetter.set(height)]);
  }

  @onDom.attributeChange(ASSET_NAME_INPUT_VALUE_ATTR)
  onNameChanged_(
      @dom.attribute(ASSET_NAME_INPUT_VALUE_ATTR) nameInput: string | null,
      @domOut.attribute(ASSET_NAME_ATTR) nameSetter: MonadSetter<string | null>):
      Iterable<MonadValue<any>> {
    if (nameSetter.value === nameInput) {
      return ImmutableList.of([]);
    }

    return ImmutableList.of([nameSetter.set(nameInput)]);
  }

  @onDom.attributeChange(ASSET_NAME_ATTR)
  onNameExportChanged_(
      @domOut.attribute(ASSET_NAME_INPUT_VALUE_ATTR) nameInputSetter: MonadSetter<string | null>,
      @dom.attribute(ASSET_NAME_ATTR) name: string | null): Iterable<MonadValue<any>> {
    if (name === nameInputSetter.value) {
      return ImmutableList.of([]);
    }
    return ImmutableList.of([nameInputSetter.set(name)]);
  }

  /**
   * Handles when a preset type menu item is clicked.
   * @param event The click event.
   */
  @onDom.event(PRESET_TYPE_MENU_CONTENT_EL, 'click')
  onPresetClicked(
      @eventDetails() event: Event,
      @domOut.innerText(PRESET_TYPE_INNER_TEXT)
          presetTypeInnerTextSetter: MonadSetter<string | null>,
      @domOut.attribute(HEIGHT_INPUT_VALUE_ATTR)
          templateHeightSetter: MonadSetter<number | null>,
      @domOut.attribute(WIDTH_INPUT_VALUE_ATTR)
          templateWidthSetter: MonadSetter<number | null>,
      @domOut.attribute(PRESET_TYPE_MENU_VISIBLE_ATTR)
          presetTypeMenuVisibleSetter: MonadSetter<boolean | null>): Iterable<MonadValue<any>> {
    const target: Element = event.target as Element;
    if (!target.hasAttribute(MENU_ITEM_VALUE_ATTR)) {
      return ImmutableList.of([]);
    }
    const type = EnumParser<PresetType>(PresetType)
        .parse(target.getAttribute(MENU_ITEM_VALUE_ATTR));
    const changes: MonadValue<any>[] = [presetTypeMenuVisibleSetter.set(false)];
    if (type === null) {
      changes.push(presetTypeInnerTextSetter.set('Select a preset ...'));
    } else {
      changes.push(presetTypeInnerTextSetter.set(Render.preset(type)));

      const presetObj = ASSET_PRESETS.get(type);
      if (presetObj) {
        changes.push(templateHeightSetter.set(presetObj.heightPx));
        changes.push(templateWidthSetter.set(presetObj.widthPx));
      }
    }

    return ImmutableList.of(changes);
  }

  /**
   * Handles when an asset type menu item is clicked.
   * @param event The click event.
   */
  @onDom.event(ASSET_TYPE_MENU_CONTENT_EL, 'click')
  onTypeClicked(
      @eventDetails() event: Event,
      @domOut.attribute(ASSET_TYPE_MENU_VISIBLE_ATTR) assetTypeMenuVisibleSetter:
          MonadSetter<boolean | null>):
      Iterable<MonadValue<any>> {
    const target: Element = event.target as Element;
    if (!target.hasAttribute(MENU_ITEM_VALUE_ATTR)) {
      return ImmutableList.of([]);
    }
    const type = EnumParser<AssetType>(AssetType).parse(target.getAttribute(MENU_ITEM_VALUE_ATTR));
    MonadUtil.callFunction({type: 'asset-changed', assetType: type}, this, 'setAssetType_');
    return ImmutableList.of([assetTypeMenuVisibleSetter.set(false)]);
  }

  @onDom.attributeChange(WIDTH_INPUT_VALUE_ATTR)
  onWidthChanged_(
      @dom.attribute(WIDTH_INPUT_VALUE_ATTR) widthInput: number | null,
      @domOut.attribute(WIDTH_ATTR) widthSetter: MonadSetter<number | null>):
      Iterable<MonadValue<any>> {
    if (widthInput === widthSetter.value) {
      return ImmutableList.of([]);
    }
    return ImmutableList.of([widthSetter.set(widthInput)]);
  }

  @onDom.attributeChange(WIDTH_ATTR)
  onWidthExportChanged_(
      @domOut.attribute(WIDTH_INPUT_VALUE_ATTR) widthInputSetter: MonadSetter<number | null>,
      @dom.attribute(WIDTH_ATTR) width: number | null):
      Iterable<MonadValue<any>> {
    if (width === widthInputSetter.value) {
      return ImmutableList.of([]);
    }
    return ImmutableList.of([widthInputSetter.set(width)]);
  }

  /**
   * Sets the type of the asset.
   * @param type Type of the asset to set.
   */
  setAssetType_(
      @eventDetails() {assetType: type}: {assetType: AssetType},
      @domOut.innerText(ASSET_TYPE_INNER_TEXT) assetTypeInnerTextSetter: MonadSetter<string | null>,
      @domOut.attribute(ASSET_TYPE_ATTR) assetTypeSetter: MonadSetter<AssetType | null>,
      @domOut.attribute(TEMPLATE_SECTION_HIDDEN_ATTR) templateSectionHiddenSetter:
          MonadSetter<boolean | null>,
      @domOut.childElements(PRESET_TYPE_MENU_CHILDREN) presetTypeMenuSetter:
          MonadSetter<ImmutableList<PresetType>>,
      @domOut.innerText(PRESET_TYPE_INNER_TEXT) presetTypeSetter:
          MonadSetter<string | null>): Iterable<MonadValue<any>> {
    const changes: MonadValue<any>[] = [
      assetTypeSetter.set(type),
      presetTypeSetter.set(''),
    ];

    if (type === null) {
      changes.push(assetTypeInnerTextSetter.set('Select a type ...'));
      changes.push(templateSectionHiddenSetter.set(true));
      changes.push(presetTypeMenuSetter.set(ImmutableList.of([])));
    } else {
      changes.push(assetTypeInnerTextSetter.set(Asset2.renderType(type)));
      changes.push(templateSectionHiddenSetter.set(false));
      changes.push(presetTypeMenuSetter.set(ASSET_MAP_.get(type) || ImmutableList.of([])));
    }

    return ImmutableList.of(changes);
  }
}

import { DomEvent, ListenableDom } from 'external/gs_tools/src/event';
import { inject } from 'external/gs_tools/src/inject';
import { BooleanParser, EnumParser, FloatParser, StringParser } from 'external/gs_tools/src/parse';
import {
  ChildElementDataHelper,
  customElement,
  DomHook,
  handle,
  hook } from 'external/gs_tools/src/webc';

import { BaseThemedElement } from 'external/gs_ui/src/common';
import { ThemeService } from 'external/gs_ui/src/theming';

import { ASSET_PRESETS, PresetType, Render } from '../asset/asset-presets';
import { Asset, AssetType } from '../data/asset';


export const ASSET_TYPE_MENU_DATA_HELPER: ChildElementDataHelper<AssetType> = {
  /**
   * @override
   */
  create(document: Document, instance: Editor): Element {
    const element = document.createElement('gs-menu-item');
    const listenable = ListenableDom.of(element);
    instance.addDisposable(listenable);
    instance.listenTo(listenable, DomEvent.CLICK, instance.onTypeClicked);
    return element;
  },

  /**
   * @override
   */
  get(element: Element): AssetType | null {
    const strValue = element.getAttribute('gs-value');
    return strValue === null ? null : EnumParser<AssetType>(AssetType).parse(strValue);
  },

  /**
   * @override
   */
  set(data: AssetType, element: Element): void {
    element.setAttribute('gs-content', Asset.renderType(data));
    element.setAttribute('gs-value', EnumParser(AssetType).stringify(data));
  },
};


export const PRESET_TYPE_MENU_DATA_HELPER: ChildElementDataHelper<PresetType> = {
  /**
   * @override
   */
  create(document: Document, instance: Editor): Element {
    const element = document.createElement('gs-menu-item');
    const listenable = ListenableDom.of(element);
    instance.addDisposable(listenable);
    instance.listenTo(listenable, DomEvent.CLICK, instance.onPresetClicked);
    return element;
  },

  /**
   * @override
   */
  get(element: Element): PresetType | null {
    const strValue = element.getAttribute('gs-value');
    return strValue === null ? null : EnumParser<PresetType>(PresetType).parse(strValue);
  },

  /**
   * @override
   */
  set(data: PresetType, element: Element): void {
    element.setAttribute('gs-content', Render.preset(data));
    element.setAttribute('gs-value', EnumParser(PresetType).stringify(data));
  },
};


export const ASSET_MAP_: Map<AssetType, PresetType[]> = new Map([
  [
    AssetType.CARD,
    [PresetType.GAME_CRAFTER_DECK_POKER, PresetType.GAME_CRAFTER_DECK_SQUARE],
  ],
]);


/**
 * Asset editor.
 */
@customElement({
  tag: 'pa-asset-editor',
  templateKey: 'src/asset/editor',
})
export class Editor extends BaseThemedElement {
  @hook(null).attribute('asset-type', EnumParser(AssetType))
  readonly assetTypeExportHook_: DomHook<AssetType>;

  @hook('#assetType').innerText()
  readonly assetTypeHook_: DomHook<string>;

  @hook('#assetTypeMenu').childrenElements<AssetType>(ASSET_TYPE_MENU_DATA_HELPER)
  readonly assetTypeMenuHook_: DomHook<AssetType[]>;

  @hook(null).attribute('asset-name', StringParser)
  readonly nameExportHook_: DomHook<string>;

  @hook('#nameInput').attribute('gs-value', StringParser)
  readonly nameValueHook_: DomHook<string>;

  @hook('#presetType').innerText()
  readonly presetTypeHook_: DomHook<string>;

  @hook('#presetTypeMenu').childrenElements<PresetType>(PRESET_TYPE_MENU_DATA_HELPER)
  readonly presetTypeMenuHook_: DomHook<PresetType[]>;

  @hook(null).attribute('asset-height', FloatParser)
  readonly templateHeightExportHook_: DomHook<number>;

  @hook('#heightInput').attribute('gs-value', FloatParser)
  readonly templateHeightHook_: DomHook<number>;

  @hook('#templateSection').attribute('hidden', BooleanParser)
  readonly templateSectionHiddenHook_: DomHook<boolean>;

  @hook(null).attribute('asset-width', FloatParser)
  readonly templateWidthExportHook_: DomHook<number>;

  @hook('#widthInput').attribute('gs-value', FloatParser)
  readonly templateWidthHook_: DomHook<number>;

  private assetType_: AssetType | null;
  private presetType_: PresetType | null;

  constructor(
      @inject('theming.ThemeService') themeService: ThemeService) {
    super(themeService);
    this.assetTypeExportHook_ = DomHook.of<AssetType>();
    this.assetTypeHook_ = DomHook.of<string>();
    this.assetTypeMenuHook_ = DomHook.of<AssetType[]>();
    this.nameExportHook_ = DomHook.of<string>();
    this.nameValueHook_ = DomHook.of<string>();
    this.presetTypeHook_ = DomHook.of<string>();
    this.presetTypeMenuHook_ = DomHook.of<PresetType[]>();
    this.templateHeightExportHook_ = DomHook.of<number>();
    this.templateHeightHook_ = DomHook.of<number>();
    this.templateSectionHiddenHook_ = DomHook.of<boolean>(true);
    this.templateWidthExportHook_ = DomHook.of<number>();
    this.templateWidthHook_ = DomHook.of<number>();
  }

  /**
   * @override
   */
  onCreated(element: HTMLElement): void {
    super.onCreated(element);
    this.assetTypeMenuHook_.set([AssetType.CARD]);
  }

  @handle(null).attributeChange('asset-type')
  onAssetTypeExportChanged_(): void {
    const assetType = this.assetTypeExportHook_.get();
    if (assetType === this.assetType_) {
      return;
    }

    this.setAssetType_(assetType);
  }

  @handle('#heightInput').attributeChange('gs-value')
  onHeightChanged_(): void {
    const height = this.templateHeightHook_.get();
    if (height === this.templateHeightExportHook_.get()) {
      return;
    }

    if (height === null) {
      this.templateHeightExportHook_.delete();
    } else {
      this.templateHeightExportHook_.set(height);
    }
  }

  @handle(null).attributeChange('asset-height')
  onHeightExportChanged_(): void {
    const height = this.templateHeightExportHook_.get();
    if (height === this.templateHeightHook_.get()) {
      return;
    }

    if (height === null) {
      this.templateHeightHook_.delete();
    } else {
      this.templateHeightHook_.set(height);
    }
  }

  @handle('#nameInput').attributeChange('gs-value')
  onNameChanged_(): void {
    const name = this.nameValueHook_.get();
    if (name === this.nameExportHook_.get()) {
      return;
    }

    if (name === null) {
      this.nameExportHook_.delete();
    } else {
      this.nameExportHook_.set(name);
    }
  }

  @handle(null).attributeChange('asset-name')
  onNameExportChanged_(): void {
    const name = this.nameExportHook_.get();
    if (name === this.nameValueHook_.get()) {
      return;
    }

    if (name === null) {
      this.nameValueHook_.delete();
    } else {
      this.nameValueHook_.set(name);
    }
  }

  /**
   * Handles when a preset type menu item is clicked.
   * @param event The click event.
   */
  onPresetClicked(event: Event): void {
    const target: Element = <Element> event.target;
    const type = EnumParser<PresetType>(PresetType).parse(target.getAttribute('gs-value'));
    this.setPresetType_(type);
  }

  /**
   * Handles when an asset type menu item is clicked.
   * @param event The click event.
   */
  onTypeClicked(event: Event): void {
    const target: Element = <Element> event.target;
    const type = EnumParser<AssetType>(AssetType).parse(target.getAttribute('gs-value'));
    this.setAssetType_(type);
  }

  @handle('#widthInput').attributeChange('gs-value')
  onWidthChanged_(): void {
    const width = this.templateWidthHook_.get();
    if (width === this.templateWidthExportHook_.get()) {
      return;
    }

    if (width === null) {
      this.templateWidthExportHook_.delete();
    } else {
      this.templateWidthExportHook_.set(width);
    }
  }

  @handle(null).attributeChange('asset-width')
  onWidthExportChanged_(): void {
    const width = this.templateWidthExportHook_.get();
    if (width === this.templateWidthHook_.get()) {
      return;
    }

    if (width === null) {
      this.templateWidthHook_.delete();
    } else {
      this.templateWidthHook_.set(width);
    }
  }

  /**
   * Sets the type of the asset.
   * @param type Type of the asset to set.
   */
  private setAssetType_(type: AssetType | null): void {
    this.assetType_ = type;
    if (type === null) {
      this.assetTypeHook_.set('Select a type ...');
      this.assetTypeExportHook_.delete();
    } else {
      this.assetTypeHook_.set(Asset.renderType(type));
      this.assetTypeExportHook_.set(type);
    }
    this.updateTemplateSection_();
  }

  /**
   * Sets the type of the preset.
   * @param type Type of the preset to set.
   */
  private setPresetType_(type: PresetType | null): void {
    this.presetType_ = type;
    if (type === null) {
      this.presetTypeHook_.set('Select a preset ...');
    } else {
      this.presetTypeHook_.set(Render.preset(type));

      const presetObj = ASSET_PRESETS.get(type);
      if (presetObj !== undefined) {
        this.templateHeightHook_.set(presetObj.heightPx);
        this.templateWidthHook_.set(presetObj.widthPx);
      }
    }
  }

  /**
   * Updates the template section.
   */
  private updateTemplateSection_(): void {
    if (this.assetType_ === null) {
      this.templateSectionHiddenHook_.set(true);
      this.presetTypeMenuHook_.set([]);
    } else {
      this.templateSectionHiddenHook_.set(false);
      this.presetTypeMenuHook_.set(ASSET_MAP_.get(this.assetType_) || []);
    }
    this.presetTypeHook_.set('');
  }
}

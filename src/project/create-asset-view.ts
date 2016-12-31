import {DomEvent, ListenableDom} from 'external/gs_tools/src/event';
import {inject} from 'external/gs_tools/src/inject';
import {Validate} from 'external/gs_tools/src/valid';
import {
    bind,
    BooleanParser,
    customElement,
    DomBridge,
    EnumParser,
    FloatParser,
    handle,
    StringParser} from 'external/gs_tools/src/webc';

import {BaseThemedElement} from 'external/gs_ui/src/common';
import {Event} from 'external/gs_ui/src/const';
import {RouteService} from 'external/gs_ui/src/routing';
import {ThemeService} from 'external/gs_ui/src/theming';

import {Asset, AssetType} from '../data/asset';
import {AssetCollection} from '../data/asset-collection';
import {RouteFactoryService} from '../routing/route-factory-service';
import {Views} from '../routing/views';

import {ASSET_PRESETS, PresetType, Render} from './asset-presets';


export const ASSET_MAP_: Map<AssetType, PresetType[]> = new Map([
  [
    AssetType.CARD,
    [PresetType.GAME_CRAFTER_DECK_POKER, PresetType.GAME_CRAFTER_DECK_SQUARE],
  ],
]);

/**
 * Generates the menu to pick asset types.
 *
 * @param document The owner document.
 * @param instance Pointer to instance of the view.
 * @return The newly generated element.
 */
export function assetTypeMenuGenerator(document: Document, instance: CreateAssetView): Element {
  let element = document.createElement('gs-menu-item');
  let listenable = ListenableDom.of(element);
  instance.addDisposable(
      listenable,
      listenable.on(DomEvent.CLICK, instance.onTypeClicked, instance));
  return element;
}

/**
 * Sets the data to the generated menu element.
 *
 * @param data The data to set.
 * @param element The element to set the data to.
 */
export function assetTypeMenuDataSetter(data: AssetType, element: Element): void {
  element.setAttribute('gs-content', Asset.renderType(data));
  element.setAttribute('gs-value', EnumParser(AssetType).stringify(data));
}

/**
 * Generates the menu to pick preset types.
 *
 * @param document The owner document.
 * @param instance Pointer to the instance of the view.
 * @return The newly generated element.
 */
export function presetTypeMenuGenerator(document: Document, instance: CreateAssetView): Element {
  let element = document.createElement('gs-menu-item');
  let listenable = ListenableDom.of(element);
  instance.addDisposable(
      listenable,
      listenable.on(DomEvent.CLICK, instance.onPresetClicked, instance));
  return element;
}

/**
 * Sets the data to the generated menu element.
 *
 * @param data The data to set.
 * @param element The element to set the data to.
 */
export function presetTypeMenuDataSetter(data: PresetType, element: Element): void {
  element.setAttribute('gs-content', Render.preset(data));
  element.setAttribute('gs-value', EnumParser(PresetType).stringify(data));
}

/**
 * The main landing view of the app.
 */
@customElement({
  dependencies: [AssetCollection],
  tag: 'pa-create-asset-view',
  templateKey: 'src/project/create-asset-view',
})
export class CreateAssetView extends BaseThemedElement {
  @bind('#assetTypeMenu')
      .childrenElements<AssetType>(assetTypeMenuGenerator, assetTypeMenuDataSetter)
  private readonly assetTypeMenuBridge_: DomBridge<AssetType[]>;

  @bind('#assetType').innerText()
  private readonly assetTypeBridge_: DomBridge<string>;

  @bind('#createButton').attribute('disabled', BooleanParser)
  private readonly createButtonDisabledBridge_: DomBridge<boolean>;

  @bind('#nameInput').attribute('gs-value', StringParser)
  private readonly nameValueBridge_: DomBridge<string>;

  @bind('#presetTypeMenu')
      .childrenElements<PresetType>(presetTypeMenuGenerator, presetTypeMenuDataSetter)
  private readonly presetTypeMenuBridge_: DomBridge<PresetType[]>;

  @bind('#presetType').innerText()
  private readonly presetTypeBridge_: DomBridge<string>;

  @bind('#heightInput').attribute('gs-value', FloatParser)
  private readonly templateHeightBridge_: DomBridge<number>;

  @bind('#templateSection').classList()
  private readonly templateSectionClassListBridge_: DomBridge<Set<string>>;

  @bind('#widthInput').attribute('gs-value', FloatParser)
  private readonly templateWidthBridge_: DomBridge<number>;

  private readonly assetCollection_: AssetCollection;
  private readonly routeFactoryService_: RouteFactoryService;
  private readonly routeService_: RouteService<Views>;
  private assetType_: AssetType | null;
  private presetType_: PresetType | null;

  /**
   * @param themeService
   * @param projectCollection
   */
  constructor(
      @inject('theming.ThemeService') themeService: ThemeService,
      @inject('pa.data.AssetCollection') assetCollection: AssetCollection,
      @inject('pa.routing.RouteFactoryService') routeFactoryService: RouteFactoryService,
      @inject('gs.routing.RouteService') routeService: RouteService<Views>) {
    super(themeService);
    this.assetType_ = null;
    this.createButtonDisabledBridge_ = DomBridge.of<boolean>(true);
    this.nameValueBridge_ = DomBridge.of<string>();
    this.assetCollection_ = assetCollection;
    this.assetTypeBridge_ = DomBridge.of<string>();
    this.assetTypeMenuBridge_ = DomBridge.of<number[]>();
    this.presetTypeMenuBridge_ = DomBridge.of<PresetType[]>();
    this.presetTypeBridge_ = DomBridge.of<string>();
    this.routeFactoryService_ = routeFactoryService;
    this.routeService_ = routeService;
    this.templateHeightBridge_ = DomBridge.of<number>();
    this.templateSectionClassListBridge_ = DomBridge.of<Set<string>>();
    this.templateWidthBridge_ = DomBridge.of<number>();
  }

  /**
   * @return Project ID of the view, or null if there is none.
   */
  private getProjectId_(): string | null {
    let params = this.routeService_.getParams(this.routeFactoryService_.createAsset());
    return params === null ? null : params.projectId;
  }

  /**
   * Resets the form.
   */
  private reset_(): void {
    this.setAssetType_(null);
    this.nameValueBridge_.set('');
  }

  /**
   * Sets the type of the asset.
   * @param type Type of the asset to set.
   */
  private setAssetType_(type: AssetType | null): void {
    this.assetType_ = type;
    if (type === null) {
      this.assetTypeBridge_.set('Select a type ...');
    } else {
      this.assetTypeBridge_.set(Asset.renderType(type));
    }
    this.updateTemplateSection_();
    this.verifyInput_();
  }

  /**
   * Sets the type of the preset.
   * @param type Type of the preset to set.
   */
  private setPresetType_(type: PresetType | null): void {
    this.presetType_ = type;
    if (type === null) {
      this.presetTypeBridge_.set('Select a preset ...');
    } else {
      this.presetTypeBridge_.set(Render.preset(type));

      let presetObj = ASSET_PRESETS.get(type);
      if (presetObj !== undefined) {
        this.templateHeightBridge_.set(presetObj.heightPx);
        this.templateWidthBridge_.set(presetObj.widthPx);
      }
    }

    this.verifyInput_();
  }

  /**
   * Updates the template section.
   */
  private updateTemplateSection_(): void {
    let classes: Set<string> = this.templateSectionClassListBridge_.get() || new Set();
    if (this.assetType_ === null) {
      classes.delete('active');
      this.presetTypeMenuBridge_.set([]);
    } else {
      classes.add('active');
      this.presetTypeMenuBridge_.set(ASSET_MAP_.get(this.assetType_) || []);
    }
    this.presetTypeBridge_.set('');
    this.templateSectionClassListBridge_.set(classes);
    this.verifyInput_();
  }

  /**
   * Verifies the input values.
   */
  @handle('#heightInput').attributeChange('gs-value', FloatParser)
  @handle('#nameInput').attributeChange('gs-value', StringParser)
  @handle('#widthInput').attributeChange('gs-value', FloatParser)
  private verifyInput_(): void {
    this.createButtonDisabledBridge_.set(
        !this.nameValueBridge_.get()
        || this.assetType_ === null
        || Number.isNaN(this.templateWidthBridge_.get() || NaN)
        || Number.isNaN(this.templateHeightBridge_.get() || NaN));
  }

  /**
   * Handles event when the cancel button is clicked.
   */
  @handle('#cancelButton').event(Event.ACTION)
  protected onCancelAction_(): void {
    let projectId = this.getProjectId_();
    if (projectId !== null) {
      this.reset_();
      this.routeService_.goTo(this.routeFactoryService_.assetList(), {projectId: projectId});
    }
  }

  /**
   * Handles event when the submit button is clicked.
   *
   * @return Promise that will be resolved when all handling logic have completed.
   */
  @handle('#createButton').event(Event.ACTION)
  protected onSubmitAction_(): Promise<void> {
    const assetName = this.nameValueBridge_.get();
    if (!assetName) {
      throw Validate.fail('Project name is not set');
    }

    const assetType = this.assetType_;
    if (assetType === null) {
      throw Validate.fail('Asset type is not set');
    }

    const height = this.templateHeightBridge_.get();
    if (height === null || Number.isNaN(height)) {
      throw Validate.fail('Asset height is not set');
    }

    const width = this.templateWidthBridge_.get();
    if (width === null || Number.isNaN(width)) {
      throw Validate.fail('Asset width is not set');
    }

    const projectId = this.getProjectId_();
    if (projectId === null) {
      return Promise.resolve();
    }

    return this.assetCollection_
        .reserveId(projectId)
        .then((id: string) => {
          let asset = new Asset(id, projectId);
          asset.setName(assetName);
          asset.setType(assetType);
          asset.setHeight(height);
          asset.setWidth(width);
          return this.assetCollection_.update(asset, projectId);
        })
        .then(() => {
          this.reset_();
          this.routeService_
              .goTo(this.routeFactoryService_.assetList(), {projectId: projectId});
        });
  }

  /**
   * @override
   */
  onCreated(element: HTMLElement): void {
    super.onCreated(element);
    this.assetTypeMenuBridge_.set([AssetType.CARD]);
    this.setAssetType_(null);
  }

  /**
   * Handles when a preset type menu item is clicked.
   * @param event The click event.
   */
  onPresetClicked(event: Event): void {
    let target: Element = <Element> event.target;
    let type = EnumParser<PresetType>(PresetType).parse(target.getAttribute('gs-value'));
    this.setPresetType_(type);
  }

  /**
   * Handles when an asset type menu item is clicked.
   * @param event The click event.
   */
  onTypeClicked(event: Event): void {
    let target: Element = <Element> event.target;
    let type = EnumParser<AssetType>(AssetType).parse(target.getAttribute('gs-value'));
    this.setAssetType_(type);
  }
}

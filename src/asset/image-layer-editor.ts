import {Arrays} from 'external/gs_tools/src/collection';
import {DisposableFunction} from 'external/gs_tools/src/dispose';
import {DomEvent} from 'external/gs_tools/src/event';
import {inject} from 'external/gs_tools/src/inject';
import {
  bind,
  customElement,
  DomHook,
  FloatParser,
  handle,
  IntegerParser,
  StringParser} from 'external/gs_tools/src/webc';

import {BaseThemedElement} from 'external/gs_ui/src/common';
import {ThemeService} from 'external/gs_ui/src/theming';

import {SampleDataService} from '../common/sample-data-service';
import {Asset} from '../data/asset';
import {AssetCollection} from '../data/asset-collection';
import {BaseLayer} from '../data/base-layer';
import {DataEvents} from '../data/data-events';
import {ImageLayer} from '../data/image-layer';
import {TemplateCompilerService} from '../data/template-compiler-service';



/**
 * Image Layer
 */
@customElement({
  dependencies: [TemplateCompilerService],
  tag: 'pa-asset-image-layer-editor',
  templateKey: 'src/asset/image-layer-editor',
})
export class ImageLayerEditor extends BaseThemedElement {
  @bind(null).attribute('asset-id', StringParser)
  private assetIdHook_: DomHook<string>;

  @bind('#bottom').attribute('gs-value', FloatParser)
  private bottomHook_: DomHook<number | null>;

  @bind(null).attribute('data-row', IntegerParser)
  private dataRowHook_: DomHook<number>;

  @bind('#imagePreview').property('style')
  private imagePreviewStyleHook_: DomHook<CSSStyleDeclaration>;

  @bind('#imageUrl').attribute('gs-value', StringParser)
  private imageUrlHook_: DomHook<string>;

  @bind(null).attribute('layer-id', StringParser)
  private layerIdHook_: DomHook<string>;

  @bind('#left').attribute('gs-value', FloatParser)
  private leftHook_: DomHook<number | null>;

  @bind(null).attribute('project-id', StringParser)
  private projectIdHook_: DomHook<string>;

  @bind('#right').attribute('gs-value', FloatParser)
  private rightHook_: DomHook<number | null>;

  @bind('#top').attribute('gs-value', FloatParser)
  private topHook_: DomHook<number | null>;

  private readonly assetCollection_: AssetCollection;
  private readonly sampleDataService_: SampleDataService;
  private readonly templateCompilerService_: TemplateCompilerService;

  private layerDeregister_: DisposableFunction | null;

  constructor(
      @inject('pa.data.AssetCollection') assetCollection: AssetCollection,
      @inject('pa.common.SampleDataService') sampleDataService: SampleDataService,
      @inject('pa.data.TemplateCompilerService') templateCompilerService: TemplateCompilerService,
      @inject('theming.ThemeService') themeService: ThemeService) {
    super(themeService);
    this.assetCollection_ = assetCollection;
    this.assetIdHook_ = DomHook.of<string>();
    this.bottomHook_ = DomHook.of<number>();
    this.dataRowHook_ = DomHook.of<number>();
    this.imagePreviewStyleHook_ = DomHook.of<CSSStyleDeclaration>();
    this.imageUrlHook_ = DomHook.of<string>();
    this.layerDeregister_ = null;
    this.layerIdHook_ = DomHook.of<string>();
    this.leftHook_ = DomHook.of<number>();
    this.projectIdHook_ = DomHook.of<string>();
    this.rightHook_ = DomHook.of<number>();
    this.sampleDataService_ = sampleDataService;
    this.templateCompilerService_ = templateCompilerService;
    this.topHook_ = DomHook.of<number>();
  }

  /**
   * Gets the asset to use.
   * @return Promise that will be resolved with the asset, or null if it cannot be found.
   */
  private async getAsset_(): Promise<Asset | null> {
    let assetId = this.assetIdHook_.get();
    let projectId = this.projectIdHook_.get();
    if (assetId === null || projectId === null) {
      return null;
    }

    return await this.assetCollection_.get(projectId, assetId);
  }

  /**
   * Gets the layer to edit.
   * @return Promise that will be resolved with the layer, or null if it cannot be found.
   */
  private async getLayer_(): Promise<ImageLayer | null> {
    const layerId = this.layerIdHook_.get();
    if (layerId === null) {
      return null;
    }

    let asset = await this.getAsset_();
    if (asset === null) {
      return null;
    }

    let layer = Arrays
        .of(asset.getLayers())
        .find((layer: BaseLayer) => {
          return layer.getId() === layerId;
        });

    if (layer === null) {
      return null;
    }

    if (!(layer instanceof ImageLayer)) {
      return null;
    }

    return layer;
  }

  /**
   * Handles when there is data change on the given layer.
   * @param layer Layer whose data was changed.
   */
  private onLayerChange_(layer: ImageLayer): void {
    this.topHook_.set(layer.getTop());
    this.bottomHook_.set(layer.getBottom());
    this.leftHook_.set(layer.getLeft());
    this.rightHook_.set(layer.getRight());
    this.imageUrlHook_.set(layer.getImageUrl());
  }

  @handle(null).attributeChange('asset-id', StringParser)
  @handle(null).attributeChange('project-id', StringParser)
  @handle(null).attributeChange('layer-id', StringParser)
  protected async onLayerIdChange_(): Promise<void> {
    if (this.layerDeregister_ !== null) {
      this.layerDeregister_.dispose();
      this.layerDeregister_ = null;
    }

    let layer = await this.getLayer_();
    if (layer === null) {
      return;
    }

    this.layerDeregister_ = layer
        .on(DataEvents.CHANGED, this.onLayerChange_.bind(this, layer), this);
    this.onLayerChange_(layer);
  }


  @handle('#imageUrl').attributeChange('gs-value', StringParser)
  async onFieldChange_(): Promise<void> {
    const [asset, rowData] = await Promise.all([
      this.getAsset_(),
      this.sampleDataService_.getRowData(),
    ]);
    if (asset === null || rowData === null) {
      return;
    }

    const style = this.imagePreviewStyleHook_.get();
    const imageUrl = this.imageUrlHook_.get() || '';
    if (style !== null) {
      try {
        const templateCompiler = await this.templateCompilerService_.create(asset, rowData);
        if (templateCompiler !== null) {
          style.backgroundImage = `url(${templateCompiler.compile(imageUrl)()})`;
        }
      } catch (e) {
        // TODO: Display error.
      }
    }
  }

  @handle('#save').event(DomEvent.CLICK)
  async onSaveClick_(): Promise<void> {
    const [asset, layer] = await Promise.all([this.getAsset_(), this.getLayer_()]);
    if (asset === null || layer === null) {
      return;
    }

    const imageUrl = this.imageUrlHook_.get() || '';
    layer.setBottom(this.bottomHook_.get());
    layer.setImageUrl(imageUrl);
    layer.setLeft(this.leftHook_.get());
    layer.setRight(this.rightHook_.get());
    layer.setTop(this.topHook_.get());
    await this.assetCollection_.update(asset);
  }

  /**
   * @override
   */
  disposeInternal(): void {
    if (this.layerDeregister_ !== null) {
      this.layerDeregister_.dispose();
    }
    super.disposeInternal();
  }
}

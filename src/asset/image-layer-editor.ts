import {sequenced} from 'external/gs_tools/src/async';
import {Arrays} from 'external/gs_tools/src/collection';
import {DisposableFunction} from 'external/gs_tools/src/dispose';
import {inject} from 'external/gs_tools/src/inject';
import {
  bind,
  customElement,
  DomHook,
  handle,
  IntegerParser,
  StringParser} from 'external/gs_tools/src/webc';

import {BaseThemedElement} from 'external/gs_ui/src/common';
import {ThemeService} from 'external/gs_ui/src/theming';

import {SampleDataService} from '../common/sample-data-service';
import {SampleDataServiceEvent} from '../common/sample-data-service-event';
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
  readonly assetIdHook_: DomHook<string>;

  @bind(null).attribute('data-row', IntegerParser)
  readonly dataRowHook_: DomHook<number>;

  @bind('#imagePreview').property('style')
  readonly imagePreviewStyleHook_: DomHook<CSSStyleDeclaration>;

  @bind('#imageUrl').attribute('gs-value', StringParser)
  readonly imageUrlHook_: DomHook<string>;

  @bind(null).attribute('layer-id', StringParser)
  readonly layerIdHook_: DomHook<string>;

  @bind(null).attribute('project-id', StringParser)
  readonly projectIdHook_: DomHook<string>;

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
    this.dataRowHook_ = DomHook.of<number>();
    this.imagePreviewStyleHook_ = DomHook.of<CSSStyleDeclaration>();
    this.imageUrlHook_ = DomHook.of<string>();
    this.layerDeregister_ = null;
    this.layerIdHook_ = DomHook.of<string>();
    this.projectIdHook_ = DomHook.of<string>();
    this.sampleDataService_ = sampleDataService;
    this.templateCompilerService_ = templateCompilerService;
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
   * @override
   */
  onCreated(element: HTMLElement): void {
    super.onCreated(element);
    this.addDisposable(this.sampleDataService_.on(
        SampleDataServiceEvent.ROW_CHANGED,
        this.onSampleDataRowChanged_,
        this));
  }

  @handle('#imageUrl').attributeChange('gs-value')
  async onDataChanged_(): Promise<void> {
    const [asset, layer] = await Promise.all([this.getAsset_(), this.getLayer_()]);
    if (asset === null || layer === null) {
      return;
    }

    const imageUrl = this.imageUrlHook_.get() || '';
    layer.setImageUrl(imageUrl);
    await this.assetCollection_.update(asset);
  }

  @handle('#imageUrl').attributeChange('gs-value')
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
          style.backgroundImage = `url(${templateCompiler.compile(imageUrl)})`;
        }
      } catch (e) {
        // TODO: Display error.
      }
    }
  }

  /**
   * Handles when there is data change on the given layer.
   * @param layer Layer whose data was changed.
   */
  private onLayerChange_(layer: ImageLayer): void {
    this.imageUrlHook_.set(layer.getImageUrl());
  }

  @handle(null).attributeChange('asset-id')
  @handle(null).attributeChange('project-id')
  @handle(null).attributeChange('layer-id')
  @sequenced()
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

  /**
   * Handles when the sample data row is changed.
   */
  private onSampleDataRowChanged_(): void {
    this.onFieldChange_();
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

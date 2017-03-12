import { inject } from 'external/gs_tools/src/inject';
import {
  bind,
  customElement,
  DomHook,
  handle,
  StringParser } from 'external/gs_tools/src/webc';

import { ThemeService } from 'external/gs_ui/src/theming';

import { AbstractLayerEditor } from '../asset/abstract-layer-editor';
import { SampleDataService } from '../common/sample-data-service';
import { SampleDataServiceEvent } from '../common/sample-data-service-event';
import { AssetCollection } from '../data/asset-collection';
import { BaseLayer } from '../data/base-layer';
import { ImageLayer } from '../data/image-layer';
import { TemplateCompilerService } from '../data/template-compiler-service';


/**
 * Image Layer
 */
@customElement({
  dependencies: [TemplateCompilerService],
  tag: 'pa-asset-image-layer-editor',
  templateKey: 'src/asset/image-layer-editor',
})
export class ImageLayerEditor extends AbstractLayerEditor<ImageLayer> {
  @bind('#imagePreview').property('style')
  readonly imagePreviewStyleHook_: DomHook<CSSStyleDeclaration>;

  @bind('#imageUrl').attribute('gs-value', StringParser)
  readonly imageUrlHook_: DomHook<string>;

  private readonly sampleDataService_: SampleDataService;
  private readonly templateCompilerService_: TemplateCompilerService;

  constructor(
      @inject('pa.data.AssetCollection') assetCollection: AssetCollection,
      @inject('pa.common.SampleDataService') sampleDataService: SampleDataService,
      @inject('pa.data.TemplateCompilerService') templateCompilerService: TemplateCompilerService,
      @inject('theming.ThemeService') themeService: ThemeService) {
    super(assetCollection, themeService);
    this.imagePreviewStyleHook_ = DomHook.of<CSSStyleDeclaration>();
    this.imageUrlHook_ = DomHook.of<string>();
    this.sampleDataService_ = sampleDataService;
    this.templateCompilerService_ = templateCompilerService;
  }

  /**
   * @override
   */
  checkLayer_(layer: BaseLayer): ImageLayer | null {
    return layer instanceof ImageLayer ? layer : null;
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
  protected onLayerChange_(layer: ImageLayer): void {
    this.imageUrlHook_.set(layer.getImageUrl());
  }

  /**
   * Handles when the sample data row is changed.
   */
  private onSampleDataRowChanged_(): void {
    this.onFieldChange_();
  }
}

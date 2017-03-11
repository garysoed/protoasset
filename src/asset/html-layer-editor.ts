import { inject } from 'external/gs_tools/src/inject';
import {
  bind,
  customElement,
  DomHook,
  handle,
  IntegerParser,
  StringParser } from 'external/gs_tools/src/webc';

import { ThemeService } from 'external/gs_ui/src/theming';

import { AbstractLayerEditor } from '../asset/abstract-layer-editor';
import { SampleDataService } from '../common/sample-data-service';
import { SampleDataServiceEvent } from '../common/sample-data-service-event';
import { AssetCollection } from '../data/asset-collection';
import { BaseLayer } from '../data/base-layer';
import { TemplateCompilerService } from '../data/template-compiler-service';
import { HtmlLayer } from 'src/data/html-layer';


/**
 * HTML Layer Editor
 */
@customElement({
  dependencies: [TemplateCompilerService],
  tag: 'pa-asset-html-layer-editor',
  templateKey: 'src/asset/html-layer-editor',
})
export class HtmlLayerEditor extends AbstractLayerEditor<HtmlLayer> {
  @bind(null).attribute('data-row', IntegerParser)
  readonly dataRowHook_: DomHook<number>;

  private readonly sampleDataService_: SampleDataService;
  private readonly templateCompilerService_: TemplateCompilerService;

  constructor(
      @inject('pa.data.AssetCollection') assetCollection: AssetCollection,
      @inject('pa.common.SampleDataService') sampleDataService: SampleDataService,
      @inject('pa.data.TemplateCompilerService') templateCompilerService: TemplateCompilerService,
      @inject('theming.ThemeService') themeService: ThemeService) {
    super(assetCollection, themeService);
    this.dataRowHook_ = DomHook.of<number>();
    this.sampleDataService_ = sampleDataService;
    this.templateCompilerService_ = templateCompilerService;
  }

  /**
   * @override
   */
  checkLayer_(layer: BaseLayer): HtmlLayer | null {
    return layer instanceof HtmlLayer ? layer : null;
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

  async onDataChanged_(): Promise<void> {
    const [asset, layer] = await Promise.all([this.getAsset_(), this.getLayer_()]);
    if (asset === null || layer === null) {
      return;
    }
    // TODO: Implement

    await this.assetCollection_.update(asset);
  }

  async onFieldChange_(): Promise<void> {
    const [asset, rowData] = await Promise.all([
      this.getAsset_(),
      this.sampleDataService_.getRowData(),
    ]);
    if (asset === null || rowData === null) {
      return;
    }

    // TODO: Implement
  }

  /**
   * Handles when there is data change on the given layer.
   * @param layer Layer whose data was changed.
   */
  protected onLayerChange_(layer: HtmlLayer): void {
    // TODO: Implement
  }

  /**
   * Handles when the sample data row is changed.
   */
  private onSampleDataRowChanged_(): void {
    this.onFieldChange_();
  }
}

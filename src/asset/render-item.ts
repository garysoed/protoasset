import { atomic } from 'external/gs_tools/src/async';
import { inject } from 'external/gs_tools/src/inject';
import { BooleanParser, IntegerParser, StringParser } from 'external/gs_tools/src/parse';
import {
  customElement,
  DomHook,
  handle,
  hook } from 'external/gs_tools/src/webc';

import { BaseThemedElement } from 'external/gs_ui/src/common';
import { ThemeService } from 'external/gs_ui/src/theming';

import { Asset } from '../data/asset';
import { AssetCollection } from '../data/asset-collection';
import { RenderService } from '../render/render-service';


/**
 * Render Item
 */
@customElement({
  tag: 'pa-asset-render-item',
  templateKey: 'src/asset/render-item',
})
export class RenderItem extends BaseThemedElement {
  @hook(null).attribute('asset-id', StringParser)
  readonly assetIdHook_: DomHook<string>;

  @hook('#display').property('style')
  readonly displayStyleHook_: DomHook<CSSStyleDeclaration>;

  @hook(null).attribute('file-name', StringParser)
  readonly filenameHook_: DomHook<string>;

  @hook('#label').innerText()
  readonly labelTextHook_: DomHook<string>;

  @hook('#loading').attribute('hidden', BooleanParser)
  readonly loadingHiddenHook_: DomHook<boolean>;

  @hook(null).attribute('project-id', StringParser)
  readonly projectIdHook_: DomHook<string>;

  @hook(null).attribute('render-key', StringParser)
  readonly renderKeyHook_: DomHook<string>;

  @hook(null).attribute('render-out', StringParser)
  readonly renderOutHook_: DomHook<string>;

  @hook(null).attribute('render-row', IntegerParser)
  readonly rowHook_: DomHook<number>;

  private readonly assetCollection_: AssetCollection;
  private readonly renderService_: RenderService;

  constructor(
      @inject('pa.data.AssetCollection') assetCollection: AssetCollection,
      @inject('pa.render.RenderService') renderService: RenderService,
      @inject('theming.ThemeService') themeService: ThemeService) {
    super(themeService);
    this.assetCollection_ = assetCollection;
    this.assetIdHook_ = DomHook.of<string>();
    this.displayStyleHook_ = DomHook.of<CSSStyleDeclaration>();
    this.filenameHook_ = DomHook.of<string>();
    this.labelTextHook_ = DomHook.of<string>();
    this.loadingHiddenHook_ = DomHook.of<boolean>(true);
    this.projectIdHook_ = DomHook.of<string>();
    this.renderKeyHook_ = DomHook.of<string>();
    this.renderOutHook_ = DomHook.of<string>();
    this.renderService_ = renderService;
    this.rowHook_ = DomHook.of<number>();
  }

  @handle(null).attributeChange('file-name')
  onFilenameChanged_(): void {
    this.labelTextHook_.set(this.filenameHook_.get() || '');
  }

  @handle(null).attributeChange('asset-id')
  @handle(null).attributeChange('project-id')
  @handle(null).attributeChange('render-key')
  @handle(null).attributeChange('render-row')
  async onRenderDataChanged_(): Promise<void> {
    this.loadingHiddenHook_.set(false);
    const assetId = this.assetIdHook_.get();
    const projectId = this.projectIdHook_.get();
    const renderKey = this.renderKeyHook_.get();
    const rowHook = this.rowHook_.get();
    if (assetId === null
        || projectId === null
        || renderKey === null
        || rowHook === null) {
      return;
    }

    const asset = await this.assetCollection_.get(projectId, assetId);
    if (asset === null) {
      return;
    }

    const dataSource = asset.getData();
    if (dataSource === null) {
      return;
    }

    const allData = await dataSource.getData();
    const data = allData[rowHook];

    if (!data) {
      return;
    }

    this.render_(asset, data, renderKey);
  }

  @atomic()
  private async render_(asset: Asset, data: string[], key: string): Promise<void> {
    if (this.loadingHiddenHook_.get()) {
      return;
    }

    const element = this.getElement();
    if (element === null) {
      return;
    }

    element.dispatchAsync('render', async () => {
      const dataUri = await this.renderService_.render(asset, data);
      if (this.renderKeyHook_.get() !== key) {
        return;
      }
      this.loadingHiddenHook_.set(true);

      if (dataUri !== null) {
        const displayStyle = this.displayStyleHook_.get();
        if (displayStyle !== null) {
          displayStyle.backgroundImage = `url(${dataUri})`;
        }
        this.renderOutHook_.set(dataUri);
      }
    });
  }
}
// TODO: Mutable

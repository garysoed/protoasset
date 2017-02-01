import {Arrays, Maps} from 'external/gs_tools/src/collection';
import {inject} from 'external/gs_tools/src/inject';
import {
    bind,
    BooleanParser,
    customElement,
    DomBridge,
    FloatParser,
    handle,
    StringParser} from 'external/gs_tools/src/webc';

import {BaseThemedElement} from 'external/gs_ui/src/common';
import {FileService} from 'external/gs_ui/src/input';
import {RouteService} from 'external/gs_ui/src/routing';
import {ThemeService} from 'external/gs_ui/src/theming';

import {Asset} from '../data/asset';
import {AssetCollection} from '../data/asset-collection';
import {InMemoryDataSource} from '../data/in-memory-data-source';
import {TsvDataSource} from '../data/tsv-data-source';
import {RouteFactoryService} from '../routing/route-factory-service';
import {Views} from '../routing/views';


/**
 * Sets the data on the given element.
 *
 * @param data The data to set.
 * @param root The root element.
 */
export function previewRowDataSetter(data: string[], root: Element): void {
  Arrays
      .of(data)
      .forEach((value: string, index: number) => {
        let column: Element;
        if (root.childElementCount <= index) {
          column = root.ownerDocument.createElement('td');
          root.appendChild(column);
        } else {
          column = root.children.item(index);
        }

        column.textContent = value;
      });
}

/**
 * Generates an element for the preview.
 * @return The newly generated row element.
 */
export function previewRowGenerator(document: Document): Element {
  return document.createElement('tr');
}

/**
 * Asset data view
 */
@customElement({
  tag: 'pa-asset-data-view',
  templateKey: 'src/asset/data-view',
})
export class DataView extends BaseThemedElement {

  @bind('#dataSourceInput').attribute('gs-bundle-id', StringParser)
  private readonly dataSourceBundleIdBridge_: DomBridge<string>;

  @bind('#endRowInput').attribute('gs-value', FloatParser)
  private readonly endRowValueBridge_: DomBridge<number>;

  @bind('#preview').childrenElements(previewRowGenerator, previewRowDataSetter)
  private readonly previewChildrenBridge_: DomBridge<string[][]>;

  @bind('#startRowInput').attribute('gs-value', FloatParser)
  private readonly startRowValueBridge_: DomBridge<number>;

  private readonly assetCollection_: AssetCollection;
  private readonly fileService_: FileService;
  private readonly routeFactoryService_: RouteFactoryService;
  private readonly routeService_: RouteService<Views>;

  constructor(
      @inject('pa.data.AssetCollection') assetCollection: AssetCollection,
      @inject('gs.input.FileService') fileService: FileService,
      @inject('pa.routing.RouteFactoryService') routeFactoryService: RouteFactoryService,
      @inject('gs.routing.RouteService') routeService: RouteService<Views>,
      @inject('theming.ThemeService') themeService: ThemeService) {
    super(themeService);
    this.assetCollection_ = assetCollection;
    this.dataSourceBundleIdBridge_ = DomBridge.of<string>();
    this.endRowValueBridge_ = DomBridge.of<number>();
    this.fileService_ = fileService;
    this.previewChildrenBridge_ = DomBridge.of<string[][]>();
    this.routeFactoryService_ = routeFactoryService;
    this.routeService_ = routeService;
    this.startRowValueBridge_ = DomBridge.of<number>();
  }

  /**
   * @return Promise that will be resolved with the asset, or null if the asset cannot be found.
   */
  private getAsset_(): Promise<Asset | null> {
    let params = this.routeService_.getParams(this.routeFactoryService_.assetData());
    if (params === null) {
      return Promise.resolve(null);
    }

    const {assetId, projectId} = params;
    return this.assetCollection_.get(projectId, assetId);
  }

  @handle(null).attributeChange('gs-view-active', BooleanParser)
  protected onGsViewActiveAttrChange_(newValue: boolean | null): void {
    if (newValue === true) {
      this.updatePreview_();
    }
  }

  /**
   * Updates the asset in the storage.
   *
   * @return Promise that will be resolved when the update process is done.
   */
  private async updateAsset_(dataSource: TsvDataSource): Promise<void> {
    let asset = await this.getAsset_();
    if (asset === null) {
      return;
    }
    asset.setData(dataSource);
    await this.assetCollection_.update(asset);
  }

  @handle('#endRowInput').attributeChange('gs-value', FloatParser)
  @handle('#startRowInput').attributeChange('gs-value', FloatParser)
  @handle('#dataSourceInput').attributeChange('gs-bundle-id', StringParser)
  protected async updateDataSource_(): Promise<void> {
    const bundleId = this.dataSourceBundleIdBridge_.get();
    const startRow = this.startRowValueBridge_.get();
    const endRow = this.endRowValueBridge_.get();
    if (bundleId === null
        || endRow === null
        || Number.isNaN(endRow)
        || startRow === null
        || Number.isNaN(startRow)) {
      return Promise.resolve();
    }

    let files = await this.fileService_.processBundle(bundleId);
    if (files !== null) {
      let entry = Maps.of(files).anyEntry();
      if (entry !== null) {
        let dataSource = TsvDataSource.of(
            InMemoryDataSource.of(entry[1]),
            startRow,
            endRow);
        await this.updateAsset_(dataSource);
      }
    }

    await this.updatePreview_();
  }

  /**
   * Updates the preview for the asset, if any.
   *
   * @return Promise that will be resolved when the update process is done.
   */
  private async updatePreview_(): Promise<void> {
    this.previewChildrenBridge_.delete();
    let asset = await this.getAsset_();
    if (asset === null) {
      return;
    }

    const dataSource = asset.getData();
    if (dataSource === null) {
      return;
    }

    let data = await dataSource.getData();
    if (data === null) {
      return;
    }

    this.previewChildrenBridge_.set(data);
  }
}

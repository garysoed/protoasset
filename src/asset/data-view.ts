import { ArrayOfType, NonNullType } from 'external/gs_tools/src/check';
import { ImmutableList, Iterables } from 'external/gs_tools/src/immutable';
import { inject } from 'external/gs_tools/src/inject';
import { FloatParser, StringParser } from 'external/gs_tools/src/parse';
import {
    ChildElementDataHelper,
    customElement,
    DomHook,
    handle,
    hook } from 'external/gs_tools/src/webc';

import { BaseThemedElement } from 'external/gs_ui/src/common';
import { FileService } from 'external/gs_ui/src/input';
import { RouteService } from 'external/gs_ui/src/routing';
import { ThemeService } from 'external/gs_ui/src/theming';

import { Asset } from '../data/asset';
import { AssetCollection } from '../data/asset-collection';
import { InMemoryDataSource } from '../data/in-memory-data-source';
import { TsvDataSource } from '../data/tsv-data-source';
import { RouteFactoryService } from '../routing/route-factory-service';
import { Views } from '../routing/views';


export const PREVIEW_ROW_DATA_HELPER: ChildElementDataHelper<string[]> = {
  /**
   * @override
   */
  create(document: Document): Element {
    return document.createElement('tr');
  },

  /**
   * @override
   */
  get(root: Element): string[] | null {
    const values = ImmutableList
        .of(root.children)
        .map((child: Element) => {
          return child.textContent;
        })
        .toArray();
    return ArrayOfType<string>(NonNullType<string>()).check(values) ? values : null;
  },

  /**
   * @override
   */
  set(data: string[], root: Element): void {
    for (let index = 0; index < data.length; index++) {
      const value = data[index];
      let column: Element;
      if (root.childElementCount <= index) {
        column = root.ownerDocument.createElement('td');
        root.appendChild(column);
      } else {
        column = root.children.item(index);
      }

      column.textContent = value;
    }
  },
};


/**
 * Asset data view
 */
@customElement({
  tag: 'pa-asset-data-view',
  templateKey: 'src/asset/data-view',
})
export class DataView extends BaseThemedElement {

  private readonly assetCollection_: AssetCollection;

  @hook('#dataSourceInput').attribute('gs-bundle-id', StringParser)
  private readonly dataSourceBundleIdHook_: DomHook<string>;

  @hook('#endRowInput').attribute('gs-value', FloatParser)
  private readonly endRowValueHook_: DomHook<number>;
  private readonly fileService_: FileService;

  @hook('#preview').childrenElements(PREVIEW_ROW_DATA_HELPER)
  private readonly previewChildrenHook_: DomHook<string[][]>;
  private readonly routeFactoryService_: RouteFactoryService;
  private readonly routeService_: RouteService<Views>;

  @hook('#startRowInput').attribute('gs-value', FloatParser)
  private readonly startRowValueHook_: DomHook<number>;


  constructor(
      @inject('pa.data.AssetCollection') assetCollection: AssetCollection,
      @inject('gs.input.FileService') fileService: FileService,
      @inject('pa.routing.RouteFactoryService') routeFactoryService: RouteFactoryService,
      @inject('gs.routing.RouteService') routeService: RouteService<Views>,
      @inject('theming.ThemeService') themeService: ThemeService) {
    super(themeService);
    this.assetCollection_ = assetCollection;
    this.dataSourceBundleIdHook_ = DomHook.of<string>();
    this.endRowValueHook_ = DomHook.of<number>();
    this.fileService_ = fileService;
    this.previewChildrenHook_ = DomHook.of<string[][]>();
    this.routeFactoryService_ = routeFactoryService;
    this.routeService_ = routeService;
    this.startRowValueHook_ = DomHook.of<number>();
  }

  /**
   * @return Promise that will be resolved with the asset, or null if the asset cannot be found.
   */
  private getAsset_(): Promise<Asset | null> {
    const params = this.routeService_.getParams(this.routeFactoryService_.assetData());
    if (params === null) {
      return Promise.resolve(null);
    }

    const {assetId, projectId} = params;
    return this.assetCollection_.get(projectId, assetId);
  }

  @handle(null).attributeChange('gs-view-active')
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
    const asset = await this.getAsset_();
    if (asset === null) {
      return;
    }
    asset.setData(dataSource);
    await this.assetCollection_.update(asset);
  }

  @handle('#endRowInput').attributeChange('gs-value')
  @handle('#startRowInput').attributeChange('gs-value')
  @handle('#dataSourceInput').attributeChange('gs-bundle-id')
  protected async updateDataSource_(): Promise<void> {
    const bundleId = this.dataSourceBundleIdHook_.get();
    const startRow = this.startRowValueHook_.get();
    const endRow = this.endRowValueHook_.get();
    if (bundleId === null
        || endRow === null
        || Number.isNaN(endRow)
        || startRow === null
        || Number.isNaN(startRow)) {
      return Promise.resolve();
    }

    const files = await this.fileService_.processBundle(bundleId);
    if (files !== null && files.size > 0) {
      const dataSource = TsvDataSource.of(
          InMemoryDataSource.of(Iterables.unsafeToArray(files.values())[0]),
          startRow,
          endRow);
      await this.updateAsset_(dataSource);
    }

    await this.updatePreview_();
  }

  /**
   * Updates the preview for the asset, if any.
   *
   * @return Promise that will be resolved when the update process is done.
   */
  private async updatePreview_(): Promise<void> {
    this.previewChildrenHook_.delete();
    const asset = await this.getAsset_();
    if (asset === null) {
      return;
    }

    const dataSource = asset.getData();
    if (dataSource === null) {
      return;
    }

    const data = await dataSource.getData();
    if (data === null) {
      return;
    }

    this.previewChildrenHook_.set(data);
  }
}
// TODO: Mutable

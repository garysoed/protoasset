import { ArrayOfType, NonNullType } from 'external/gs_tools/src/check';
import { DataAccess } from 'external/gs_tools/src/datamodel';
import { monad, monadOut, on } from 'external/gs_tools/src/event';
import { ImmutableList } from 'external/gs_tools/src/immutable';
import { inject } from 'external/gs_tools/src/inject';
import { ChildElementsSelector, MonadSetter, MonadValue } from 'external/gs_tools/src/interfaces';
import { BooleanParser, IntegerParser, StringParser } from 'external/gs_tools/src/parse';
import { customElement, dom, domOut, onDom, onLifecycle } from 'external/gs_tools/src/webc';

import { BaseThemedElement2 } from 'external/gs_ui/src/common';
import { FileService } from 'external/gs_ui/src/input';
import { RouteService } from 'external/gs_ui/src/routing';
import { ThemeService } from 'external/gs_ui/src/theming';

import { AssetManager } from '../data/asset-manager';
import { Asset2 } from '../data/asset2';
import { InMemoryDataSource } from '../data/in-memory-data-source';
import { TsvDataSource } from '../data/tsv-data-source';
import { RouteFactoryService } from '../routing/route-factory-service';
import { Views } from '../routing/views';

export type PreviewData = ImmutableList<ImmutableList<string>>;

const DATA_SOURCE_INPUT_EL = '#dataSourceInput';
const END_ROW_INPUT_EL = '#endRowInput';
const PREVIEW_CHILDREN_EL = '#preview';
const START_ROW_INPUT_EL = '#startRowInput';

const DATA_SOURCE_INPUT_BUNDLE_ID_ATTR = {
  name: 'bundle-id',
  parser: StringParser,
  selector: DATA_SOURCE_INPUT_EL,
};
const END_ROW_INPUT_DISABLED_ATTR = {
  name: 'disabled',
  parser: BooleanParser,
  selector: END_ROW_INPUT_EL,
};
const END_ROW_INPUT_VALUE_ATTR = {name: 'value', parser: IntegerParser, selector: END_ROW_INPUT_EL};
const START_ROW_INPUT_DISABLED_ATTR = {
  name: 'disabled',
  parser: BooleanParser,
  selector: START_ROW_INPUT_EL,
};
const START_ROW_INPUT_VALUE_ATTR = {
  name: 'value',
  parser: IntegerParser,
  selector: START_ROW_INPUT_EL,
};
const VIEW_ACTIVE_ATTR = {name: 'gs-view-active', parser: BooleanParser, selector: null};

export const PREVIEW_CHILDREN: ChildElementsSelector<ImmutableList<string>> = {
  bridge: {
    /**
     * @override
     */
    create(document: Document): Element {
      return document.createElement('tr');
    },

    /**
     * @override
     */
    get(root: Element): ImmutableList<string> | null {
      const list = ImmutableList
          .of(root.children)
          .map((child: Element) => {
            return child.textContent;
          });
      const values = [...list];
      return ArrayOfType<string>(NonNullType<string>()).check(values) ?
          ImmutableList.of(values) :
          null;
    },

    /**
     * @override
     */
    set(data: ImmutableList<string>, root: Element): void {
      for (let index = 0; index < data.size(); index++) {
        const value = data.getAt(index) || '';
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
  },
  selector: PREVIEW_CHILDREN_EL,
};

/**
 * Asset data view
 */
@customElement({
  tag: 'pa-asset-data-view',
  templateKey: 'src/asset/data-view',
})
export class DataView extends BaseThemedElement2 {

  private readonly fileService_: FileService;
  private readonly routeFactoryService_: RouteFactoryService;
  private readonly routeService_: RouteService<Views>;

  constructor(
      @inject('gs.input.FileService') fileService: FileService,
      @inject('pa.routing.RouteFactoryService') routeFactoryService: RouteFactoryService,
      @inject('gs.routing.RouteService') routeService: RouteService<Views>,
      @inject('theming.ThemeService') themeService: ThemeService) {
    super(themeService);
    this.fileService_ = fileService;
    this.routeFactoryService_ = routeFactoryService;
    this.routeService_ = routeService;
  }

  /**
   * @return Promise that will be resolved with the asset, or null if the asset cannot be found.
   */
  private getAsset_(assetDataAccess: DataAccess<Asset2>): Promise<Asset2 | null> {
    const params = this.routeService_.getParams(this.routeFactoryService_.assetData());
    if (params === null) {
      return Promise.resolve(null);
    }

    return assetDataAccess.get(params.assetId);
  }

  /**
   * Updates the asset in the storage.
   *
   * @return Promise that will be resolved when the update process is done.
   */
  private async updateAsset_(
      dataSource: TsvDataSource,
      assetDataAccess: DataAccess<Asset2>): Promise<DataAccess<Asset2>> {
    const asset = await this.getAsset_(assetDataAccess);
    if (asset === null) {
      return assetDataAccess;
    }
    return assetDataAccess.queueUpdate(asset.getId(), asset.setData(dataSource));
  }

  @onDom.attributeChange(END_ROW_INPUT_VALUE_ATTR)
  @onDom.attributeChange(START_ROW_INPUT_VALUE_ATTR)
  @onDom.attributeChange(DATA_SOURCE_INPUT_BUNDLE_ID_ATTR)
  async updateDataSource_(
      @dom.attribute(DATA_SOURCE_INPUT_BUNDLE_ID_ATTR) bundleId: string | null,
      @dom.attribute(START_ROW_INPUT_VALUE_ATTR) startRow: number | null,
      @dom.attribute(END_ROW_INPUT_VALUE_ATTR) endRow: number | null,
      @monadOut(AssetManager.monad()) assetDataAccessSetter:
          MonadSetter<DataAccess<Asset2>>): Promise<MonadValue<any>[]> {
    if (bundleId === null
        || endRow === null
        || Number.isNaN(endRow)
        || startRow === null
        || Number.isNaN(startRow)) {
      return Promise.resolve([]);
    }

    const updates: MonadValue<any>[] = [];
    const files = await this.fileService_.processBundle(bundleId);
    if (files !== null && files.size > 0) {
      const dataSource = TsvDataSource
          .withSource(InMemoryDataSource.newInstance([...files.values()][0]))
          .setStartRow(startRow)
          .setEndRow(endRow);
      updates.push(
          assetDataAccessSetter.set(
              await this.updateAsset_(dataSource, assetDataAccessSetter.value)));
    }
    return updates;
  }

  @onDom.attributeChange(DATA_SOURCE_INPUT_BUNDLE_ID_ATTR)
  @onLifecycle('create')
  updateEndAndStartRow(
      @dom.attribute(DATA_SOURCE_INPUT_BUNDLE_ID_ATTR) bundleId: string | null,
      @domOut.attribute(START_ROW_INPUT_DISABLED_ATTR) startRowDisabledSetter:
          MonadSetter<boolean | null>,
      @domOut.attribute(END_ROW_INPUT_DISABLED_ATTR) endRowDisabledSetter:
          MonadSetter<boolean | null>): MonadValue<any>[] {
    const hasBundleId = bundleId !== null;
    return [
      startRowDisabledSetter.set(!hasBundleId),
      endRowDisabledSetter.set(!hasBundleId),
    ];
  }

  /**
   * Updates the preview for the asset, if any.
   *
   * @return Promise that will be resolved when the update process is done.
   */
  @onDom.attributeChange(VIEW_ACTIVE_ATTR)
  @on(AssetManager, 'edit')
  async updatePreview_(
      @dom.attribute(VIEW_ACTIVE_ATTR) isViewActive: boolean | null,
      @monad(AssetManager.monad()) assetDataAccess: DataAccess<Asset2>,
      @domOut.childElements(PREVIEW_CHILDREN) previewChildrenSetter:
          MonadSetter<PreviewData | null>): Promise<MonadValue<any>[]> {
    if (!isViewActive) {
      return [];
    }

    const asset = await this.getAsset_(assetDataAccess);
    if (asset === null) {
      return [previewChildrenSetter.set(null)];
    }

    const dataSource = asset.getData();
    if (dataSource === null) {
      return [previewChildrenSetter.set(null)];
    }

    const data = await dataSource.getData();
    if (data === null) {
      return [previewChildrenSetter.set(null)];
    }

    return [previewChildrenSetter.set(data)];
  }
}

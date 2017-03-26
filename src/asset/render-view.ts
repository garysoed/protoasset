import { atomic } from 'external/gs_tools/src/async';
import { Arrays } from 'external/gs_tools/src/collection';
import { DisposableFunction } from 'external/gs_tools/src/dispose';
import { DomEvent } from 'external/gs_tools/src/event';
import { inject } from 'external/gs_tools/src/inject';
import { SimpleIdGenerator } from 'external/gs_tools/src/random';
import {
  bind,
  ChildElementDataHelper,
  customElement,
  DomHook,
  handle,
  IntegerParser,
  StringParser } from 'external/gs_tools/src/webc';

import { BaseThemedElement } from 'external/gs_ui/src/common';
import { RouteService, RouteServiceEvents } from 'external/gs_ui/src/routing';
import { ThemeService } from 'external/gs_ui/src/theming';

import { RenderItem } from '../asset/render-item';
import { Asset } from '../data/asset';
import { AssetCollection } from '../data/asset-collection';
import { DataEvents } from '../data/data-events';
import { TemplateCompilerService } from '../data/template-compiler-service';
import { RouteFactoryService } from '../routing/route-factory-service';
import { Views } from '../routing/views';


type RenderData = {assetId: string, filename: string, key: string, projectId: string, row: number};


export const RENDER_ITEM_DATA_HELPER: ChildElementDataHelper<RenderData> = {
  /**
   * @override
   */
  create(document: Document): Element {
    return document.createElement('pa-asset-render-item');
  },

  /**
   * @override
   */
  get(element: Element): RenderData | null {
    const assetId = element.getAttribute('asset-id');
    const filename = element.getAttribute('file-name');
    const projectId = element.getAttribute('project-id');
    const key = element.getAttribute('render-key');
    const row = IntegerParser.parse(element.getAttribute('render-row'));
    if (assetId === null
        || filename === null
        || projectId === null
        || key === null
        || row === null) {
      return null;
    }

    return {assetId, filename, key, projectId, row};
  },

  /**
   * @override
   */
  set(renderData: RenderData, element: Element): void {
    element.setAttribute('asset-id', renderData.assetId);
    element.setAttribute('file-name', renderData.filename);
    element.setAttribute('project-id', renderData.projectId);
    element.setAttribute('render-key', renderData.key);
    element.setAttribute('render-row', IntegerParser.stringify(renderData.row));
  },
};


/**
 * Render View
 */
@customElement({
  dependencies: [RenderItem],
  tag: 'pa-asset-render-view',
  templateKey: 'src/asset/render-view',
})
export class RenderView extends BaseThemedElement {
  @bind('#renders').childrenElements(RENDER_ITEM_DATA_HELPER)
  readonly rendersChildrenHook_: DomHook<RenderData[]>;

  @bind('#filenameInput').attribute('gs-value', StringParser)
  readonly filenameInputHook_: DomHook<string>;

  private readonly assetCollection_: AssetCollection;
  private readonly expectedRenderKeys_: Set<string>;
  private readonly renderIdGenerator_: SimpleIdGenerator;
  private readonly routeFactoryService_: RouteFactoryService;
  private readonly routeService_: RouteService<Views>;
  private readonly templateCompilerService_: TemplateCompilerService;

  private assetChangedDeregister_: DisposableFunction | null;

  constructor(
      @inject('pa.data.AssetCollection') assetCollection: AssetCollection,
      @inject('pa.routing.RouteFactoryService') routeFactoryService: RouteFactoryService,
      @inject('gs.routing.RouteService') routeService: RouteService<Views>,
      @inject('pa.data.TemplateCompilerService') templateCompilerService: TemplateCompilerService,
      @inject('theming.ThemeService') themeService: ThemeService) {
    super(themeService);
    this.assetChangedDeregister_ = null;
    this.assetCollection_ = assetCollection;
    this.expectedRenderKeys_ = new Set<string>();
    this.filenameInputHook_ = DomHook.of<string>();
    this.rendersChildrenHook_ = DomHook.of<RenderData[]>();
    this.renderIdGenerator_ = new SimpleIdGenerator();
    this.routeFactoryService_ = routeFactoryService;
    this.routeService_ = routeService;
    this.templateCompilerService_ = templateCompilerService;
  }

  /**
   * @override
   */
  disposeInternal(): void {
    if (this.assetChangedDeregister_ !== null) {
      this.assetChangedDeregister_.dispose();
    }

    super.disposeInternal();
  }

  private getAsset_(): Promise<Asset | null> {
    const params = this.routeService_.getParams(this.routeFactoryService_.render());
    if (params === null) {
      return Promise.resolve(null);
    }

    const {assetId, projectId} = params;
    if (assetId === null || projectId === null) {
      return Promise.resolve(null);
    }

    return this.assetCollection_.get(projectId, assetId);
  }

  private async onAssetChanged_(): Promise<void> {
    const asset = await this.getAsset_();
    if (asset === null) {
      return;
    }

    this.filenameInputHook_.set(asset.getFilename());
  }

  /**
   * @override
   */
  onCreated(element: HTMLElement): void {
    super.onCreated(element);
    this.addDisposable(
        this.routeService_.on(
            RouteServiceEvents.CHANGED,
            this.onRouteChanged_,
            this));
    this.onRouteChanged_();
  }

  @atomic()
  @handle('#filenameInput').attributeChange('gs-value')
  async onFilenameChanged_(): Promise<void> {
    const asset = await this.getAsset_();
    if (asset === null) {
      return;
    }

    const filename = this.filenameInputHook_.get();
    if (filename === null) {
      return;
    }

    asset.setFilename(filename);
    this.assetCollection_.update(asset);
  }

  @atomic()
  @handle('#renderButton').event(DomEvent.CLICK)
  async onRenderButtonClick_(): Promise<void> {
    const asset = await this.getAsset_();
    if (asset === null) {
      return;
    }

    const dataSource = asset.getData();
    if (dataSource === null) {
      return;
    }

    const filenameTemplate = this.filenameInputHook_.get();
    if (filenameTemplate === null) {
      return;
    }

    const renderData: RenderData[] = [];
    const renderKeys: string[] = [];
    Arrays
        .of(await dataSource.getData())
        .forEach((value: string[], index: number) => {
          const key = this.renderIdGenerator_.generate(renderKeys);
          const filename = this.templateCompilerService_
              .create(asset, value)
              .compile(filenameTemplate);

          renderKeys.push(key);
          renderData.push({
            assetId: asset.getId(),
            filename,
            key,
            projectId: asset.getProjectId(),
            row: index,
          });
        });
    this.expectedRenderKeys_.clear();
    renderKeys.forEach((key: string) => {
      this.expectedRenderKeys_.add(key);
    });
    this.rendersChildrenHook_.set(renderData);
  }

  private async onRouteChanged_(): Promise<void> {
    if (this.assetChangedDeregister_ !== null) {
      this.assetChangedDeregister_.dispose();
      this.assetChangedDeregister_ = null;
    }

    const asset = await this.getAsset_();
    if (asset === null) {
      return;
    }

    this.assetChangedDeregister_ = asset.on(DataEvents.CHANGED, this.onAssetChanged_, this);
    this.onAssetChanged_();
  }
}

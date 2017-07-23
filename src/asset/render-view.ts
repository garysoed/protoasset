import { atomic } from 'external/gs_tools/src/async';
import { InstanceofType } from 'external/gs_tools/src/check';
import { DisposableFunction } from 'external/gs_tools/src/dispose';
import { DomEvent, ListenableDom } from 'external/gs_tools/src/event';
import { ImmutableSet } from 'external/gs_tools/src/immutable';
import { inject } from 'external/gs_tools/src/inject';
import { BooleanParser, IntegerParser, StringParser } from 'external/gs_tools/src/parse';
import { SimpleIdGenerator } from 'external/gs_tools/src/random';
import {
  ChildElementDataHelper,
  customElement,
  DomHook,
  handle,
  hook } from 'external/gs_tools/src/webc';

import { BaseThemedElement } from 'external/gs_ui/src/common';
import { RouteServiceEvents } from 'external/gs_ui/src/const';
import { RouteService } from 'external/gs_ui/src/routing';
import { ThemeService } from 'external/gs_ui/src/theming';
import { DownloadService } from 'external/gs_ui/src/tool';

import { RenderItem } from '../asset/render-item';
import { Asset } from '../data/asset';
import { AssetCollection } from '../data/asset-collection';
import { DataEvents } from '../data/data-events';
import { TemplateCompilerService } from '../data/template-compiler-service';
import { RouteFactoryService } from '../routing/route-factory-service';
import { Views } from '../routing/views';


type FileData = {dataUrl: string, filename: string};
type RenderData = {assetId: string, filename: string, key: string, projectId: string, row: number};


const InstanceOfElementType = InstanceofType(Element);


export const RENDER_ITEM_DATA_HELPER: ChildElementDataHelper<RenderData> = {
  /**
   * @override
   */
  create(document: Document, instance: RenderView): Element {
    const element = document.createElement('pa-asset-render-item');
    instance.listenToRenderEvent(element);
    return element;
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
  dependencies: ImmutableSet.of([RenderItem]),
  tag: 'pa-asset-render-view',
  templateKey: 'src/asset/render-view',
})
export class RenderView extends BaseThemedElement {
  @hook('#downloadButton').attribute('disabled', BooleanParser)
  readonly downloadButtonDisabledHook_: DomHook<boolean>;

  @hook('#filenameInput').attribute('gs-value', StringParser)
  readonly filenameInputHook_: DomHook<string>;

  @hook('#renders').childrenElements(RENDER_ITEM_DATA_HELPER)
  readonly rendersChildrenHook_: DomHook<RenderData[]>;

  private assetChangedDeregister_: DisposableFunction | null;
  private readonly assetCollection_: AssetCollection;
  private readonly downloadService_: DownloadService;
  private readonly expectedRenderKeys_: Set<string>;
  private readonly fileData_: Set<FileData>;
  private readonly jsZip_: new () => JSZip;
  private readonly renderIdGenerator_: SimpleIdGenerator;
  private readonly routeFactoryService_: RouteFactoryService;
  private readonly routeService_: RouteService<Views>;
  private readonly templateCompilerService_: TemplateCompilerService;

  constructor(
      @inject('pa.data.AssetCollection') assetCollection: AssetCollection,
      @inject('gs.tool.DownloadService') downloadService: DownloadService,
      @inject('x.JsZip') jsZip: new () => JSZip,
      @inject('pa.routing.RouteFactoryService') routeFactoryService: RouteFactoryService,
      @inject('gs.routing.RouteService') routeService: RouteService<Views>,
      @inject('pa.data.TemplateCompilerService') templateCompilerService: TemplateCompilerService,
      @inject('theming.ThemeService') themeService: ThemeService) {
    super(themeService);
    this.assetChangedDeregister_ = null;
    this.assetCollection_ = assetCollection;
    this.downloadButtonDisabledHook_ = DomHook.of<boolean>(true);
    this.downloadService_ = downloadService;
    this.expectedRenderKeys_ = new Set<string>();
    this.fileData_ = new Set<FileData>();
    this.jsZip_ = jsZip;
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

  /**
   * @param element Element from which the render event should be dispatched from.
   */
  listenToRenderEvent(element: Element): void {
    const listenableElement = ListenableDom.of(element);
    this.addDisposable(listenableElement);
    this.listenTo(listenableElement, 'render', this.onRendered_);
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
        this.routeService_.on(RouteServiceEvents.CHANGED, this.onRouteChanged_, this));
    this.onRouteChanged_();
    this.downloadButtonDisabledHook_.set(true);
  }

  @handle('#downloadButton').event(DomEvent.CLICK)
  async onDownloadClick_(): Promise<void> {
    const asset = await this.getAsset_();
    if (asset === null) {
      return;
    }

    const jsZip = new this.jsZip_();
    for (const fileData of this.fileData_) {
      const {dataUrl, filename} = fileData;
      const imageData = dataUrl.substring(dataUrl.indexOf(',') + 1);
      jsZip.file(filename, imageData, {base64: true});
    }

    const content = await jsZip.generateAsync({type: 'blob'});
    this.downloadService_.download(content, `${asset.getName()}.zip`);
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
    this.rendersChildrenHook_.set([]);
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
    const data = await dataSource.getData();
    for (let index = 0; index < data.length; index++) {
      const value = data[index];
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
    }
    this.fileData_.clear();
    this.expectedRenderKeys_.clear();
    renderKeys.forEach((key: string) => {
      this.expectedRenderKeys_.add(key);
    });
    this.updateRenderKey_();
    this.rendersChildrenHook_.set(renderData);
  }

  /**
   * @param event Event dispatched when the render event was dispatched.
   */
  onRendered_(event: Event): void {
    const target = event.target;
    if (InstanceOfElementType.check(target)) {
      const renderKey = target.getAttribute('render-key');
      const dataUrl = target.getAttribute('render-out');
      const filename = target.getAttribute('file-name');
      if (renderKey !== null && dataUrl !== null && filename !== null) {
        this.expectedRenderKeys_.delete(renderKey);
        this.fileData_.add({dataUrl, filename});
        this.updateRenderKey_();
      }
    }
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

    this.assetChangedDeregister_ = this.listenTo(asset, DataEvents.CHANGED, this.onAssetChanged_);
    this.onAssetChanged_();
  }

  private updateRenderKey_(): void {
    this.downloadButtonDisabledHook_.set(this.expectedRenderKeys_.size > 0);
  }
}
// TODO: Mutable

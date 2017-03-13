import { atomic } from 'external/gs_tools/src/async';
import { Arrays } from 'external/gs_tools/src/collection';
import { DomEvent } from 'external/gs_tools/src/event';
import { inject } from 'external/gs_tools/src/inject';
import { SimpleIdGenerator } from 'external/gs_tools/src/random';
import {
  bind,
  customElement,
  DomHook,
  handle,
  IntegerParser,
  StringParser } from 'external/gs_tools/src/webc';

import { BaseThemedElement } from 'external/gs_ui/src/common';
import { RouteService } from 'external/gs_ui/src/routing';
import { ThemeService } from 'external/gs_ui/src/theming';

import { RenderItem } from '../asset/render-item';
import { AssetCollection } from '../data/asset-collection';
import { TemplateCompilerService } from '../data/template-compiler-service';
import { RouteFactoryService } from '../routing/route-factory-service';
import { Views } from '../routing/views';


type RenderData = {assetId: string, filename: string, key: string, projectId: string, row: number};


/**
 * @param renderData Data to set to the element.
 * @param element Element to set the data into.
 */
export function renderItemDataSetter(renderData: RenderData, element: Element): void {
  element.setAttribute('asset-id', renderData.assetId);
  element.setAttribute('file-name', renderData.filename);
  element.setAttribute('project-id', renderData.projectId);
  element.setAttribute('render-key', renderData.key);
  element.setAttribute('render-row', IntegerParser.stringify(renderData.row));
}


/**
 * @param document Document to create the render item element.
 * @return The render item element.
 */
export function renderItemGenerator(document: Document): Element {
  return document.createElement('pa-asset-render-item');
}


/**
 * Render View
 */
@customElement({
  dependencies: [RenderItem],
  tag: 'pa-asset-render-view',
  templateKey: 'src/asset/render-view',
})
export class RenderView extends BaseThemedElement {
  @bind('#renders').childrenElements(renderItemGenerator, renderItemDataSetter)
  readonly rendersChildrenHook_: DomHook<RenderData[]>;

  @bind('#filenameInput').attribute('gs-value', StringParser)
  readonly filenameInputHook_: DomHook<string>;

  private readonly assetCollection_: AssetCollection;
  private readonly expectedRenderKeys_: Set<string>;
  private readonly renderIdGenerator_: SimpleIdGenerator;
  private readonly routeFactoryService_: RouteFactoryService;
  private readonly routeService_: RouteService<Views>;
  private readonly templateCompilerService_: TemplateCompilerService;

  constructor(
      @inject('pa.data.AssetCollection') assetCollection: AssetCollection,
      @inject('pa.routing.RouteFactoryService') routeFactoryService: RouteFactoryService,
      @inject('gs.routing.RouteService') routeService: RouteService<Views>,
      @inject('pa.data.TemplateCompilerService') templateCompilerService: TemplateCompilerService,
      @inject('theming.ThemeService') themeService: ThemeService) {
    super(themeService);
    this.assetCollection_ = assetCollection;
    this.expectedRenderKeys_ = new Set<string>();
    this.filenameInputHook_ = DomHook.of<string>();
    this.rendersChildrenHook_ = DomHook.of<RenderData[]>();
    this.renderIdGenerator_ = new SimpleIdGenerator();
    this.routeFactoryService_ = routeFactoryService;
    this.routeService_ = routeService;
    this.templateCompilerService_ = templateCompilerService;
  }

  @atomic()
  @handle('#renderButton').event(DomEvent.CLICK)
  async onRenderButtonClick_(): Promise<void> {
    const params = this.routeService_.getParams(this.routeFactoryService_.render());
    if (params === null) {
      return;
    }

    const {assetId, projectId} = params;
    if (assetId === null || projectId === null) {
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
            assetId,
            filename,
            key,
            projectId,
            row: index,
          });
        });
    this.expectedRenderKeys_.clear();
    renderKeys.forEach((key: string) => {
      this.expectedRenderKeys_.add(key);
    });
    this.rendersChildrenHook_.set(renderData);
  }
}

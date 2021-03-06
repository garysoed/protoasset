import { atomic } from 'external/gs_tools/src/async';
import { DisposableFunction } from 'external/gs_tools/src/dispose';
import { ImmutableList, ImmutableSet } from 'external/gs_tools/src/immutable';
import { inject } from 'external/gs_tools/src/inject';
import { BooleanParser, EnumParser, StringParser } from 'external/gs_tools/src/parse';
import {
  customElement,
  DomHook,
  handle,
  hook } from 'external/gs_tools/src/webc';

import { BaseThemedElement } from 'external/gs_ui/src/common';
import { RouteServiceEvents } from 'external/gs_ui/src/const';
import { RouteService } from 'external/gs_ui/src/routing';
import { ThemeService } from 'external/gs_ui/src/theming';

import { CssImportService } from '../common/css-import-service';
import { SampleDataService } from '../common/sample-data-service';
import { SampleDataServiceEvent } from '../common/sample-data-service-event';
import { Asset } from '../data/asset';
import { AssetCollection } from '../data/asset-collection';
import { BaseLayer } from '../data/base-layer';
import { DataEvents } from '../data/data-events';
import { LayerPreviewMode } from '../data/layer-preview-mode';
import { TemplateCompilerService } from '../data/template-compiler-service';
import { TextLayer } from '../data/text-layer';
import { RouteFactoryService } from '../routing/route-factory-service';
import { Views } from '../routing/views';


/**
 * Previews layers
 */
@customElement({
  dependencies: ImmutableSet.of([CssImportService]),
  tag: 'pa-asset-layer-preview',
  templateKey: 'src/asset/layer-preview',
})
export class LayerPreview extends BaseThemedElement {
  @hook('#css').property('innerHTML')
  readonly cssInnerHtmlHook_: DomHook<string>;

  @hook(null).attribute('is-selected', BooleanParser)
  readonly isSelectedHook_: DomHook<boolean>;

  @hook(null).attribute('layer-id', StringParser)
  readonly layerIdHook_: DomHook<string>;

  @hook(null).attribute('preview-mode', EnumParser(LayerPreviewMode))
  readonly previewModeHook_: DomHook<LayerPreviewMode>;

  @hook('#root').property('innerHTML')
  readonly rootInnerHtmlHook_: DomHook<string>;

  private readonly assetCollection_: AssetCollection;
  private readonly cssImportService_: CssImportService;
  private layerDeregister_: DisposableFunction | null;
  private readonly routeFactoryService_: RouteFactoryService;
  private readonly routeService_: RouteService<Views>;
  private readonly sampleDataService_: SampleDataService;
  private readonly templateCompilerService_: TemplateCompilerService;

  constructor(
      @inject('pa.data.AssetCollection') assetCollection: AssetCollection,
      @inject('pa.common.CssImportService') cssImportService: CssImportService,
      @inject('pa.routing.RouteFactoryService') routeFactoryService: RouteFactoryService,
      @inject('gs.routing.RouteService') routeService: RouteService<Views>,
      @inject('pa.common.SampleDataService') sampleDataService: SampleDataService,
      @inject('pa.data.TemplateCompilerService') templateCompilerService: TemplateCompilerService,
      @inject('theming.ThemeService') themeService: ThemeService) {
    super(themeService);
    this.assetCollection_ = assetCollection;
    this.cssImportService_ = cssImportService;
    this.cssInnerHtmlHook_ = DomHook.of<string>();
    this.isSelectedHook_ = DomHook.of<boolean>();
    this.layerDeregister_ = null;
    this.layerIdHook_ = DomHook.of<string>();
    this.previewModeHook_ = DomHook.of<LayerPreviewMode>();
    this.rootInnerHtmlHook_ = DomHook.of<string>();
    this.routeFactoryService_ = routeFactoryService;
    this.routeService_ = routeService;
    this.sampleDataService_ = sampleDataService;
    this.templateCompilerService_ = templateCompilerService;
  }

  /**
   * @override
   */
  onCreated(element: HTMLElement): void {
    super.onCreated(element);
    this.listenTo(
        this.sampleDataService_,
        SampleDataServiceEvent.ROW_CHANGED,
        this.onDataChanged_);
    this.addDisposable(
        this.routeService_.on(RouteServiceEvents.CHANGED, this.onLayerIdChanged_, this));
    this.onLayerIdChanged_();
  }

  @handle(null).attributeChange('preview-mode')
  @handle(null).attributeChange('is-selected')
  private onDataChanged_(): void {
    this.onLayerIdChanged_();
  }

  private onLayerChange_(asset: Asset, rowData: string[], layer: BaseLayer): void {
    const previewMode = this.previewModeHook_.get() || LayerPreviewMode.NORMAL;
    const isActive = this.isSelectedHook_.get() || false;

    const {css, html} = layer.asPreviewHtml(previewMode, isActive);
    const compiler = this.templateCompilerService_.create(asset, rowData);
    try {
      this.cssInnerHtmlHook_.set(compiler.compile(css));
    } catch (e) {
      this.cssInnerHtmlHook_.set('');
    }

    try {
      this.rootInnerHtmlHook_.set(compiler.compile(html));
    } catch (e) {
      this.rootInnerHtmlHook_.set('');
    }

    if (layer instanceof TextLayer) {
      const fontUrl = layer.getFontUrl();
      if (fontUrl !== null) {
        this.cssImportService_.import(fontUrl);
      }
    }
  }

  @handle(null).attributeChange('layer-id')
  @atomic()
  async onLayerIdChanged_(): Promise<void> {
    if (this.layerDeregister_ !== null) {
      this.layerDeregister_.dispose();
      this.layerDeregister_ = null;
    }
    const route = this.routeService_.monad().get().getRoute(this.routeFactoryService_.layer());
    if (route === null) {
      return;
    }

    const params = route.params;
    const [asset, rowData] = await Promise.all([
      this.assetCollection_.get(params.projectId, params.assetId),
      this.sampleDataService_.getRowData(),
    ]);
    if (asset === null || rowData === null) {
      return;
    }

    const layerId = this.layerIdHook_.get();
    if (layerId === null) {
      return;
    }

    const layer = ImmutableList
        .of(asset.getLayers())
        .find((layer: BaseLayer) => {
          return layer.getId() === layerId;
        });
    if (layer === null) {
      return;
    }

    this.layerDeregister_ = this
        .listenTo(layer, DataEvents.CHANGED, this.onLayerChange_.bind(this, asset, rowData, layer));
    this.onLayerChange_(asset, rowData, layer);
  }
}
// TODO: Mutable

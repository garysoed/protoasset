import {sequenced} from 'external/gs_tools/src/async';
import {Arrays} from 'external/gs_tools/src/collection';
import {DisposableFunction} from 'external/gs_tools/src/dispose';
import {inject} from 'external/gs_tools/src/inject';
import {
  bind,
  customElement,
  DomHook,
  handle,
  StringParser} from 'external/gs_tools/src/webc';

import {BaseThemedElement} from 'external/gs_ui/src/common';
import {RouteService, RouteServiceEvents} from 'external/gs_ui/src/routing';
import {ThemeService} from 'external/gs_ui/src/theming';

import {SampleDataService} from '../common/sample-data-service';
import {Asset} from '../data/asset';
import {AssetCollection} from '../data/asset-collection';
import {BaseLayer} from '../data/base-layer';
import {DataEvents} from '../data/data-events';
import {TemplateCompilerService} from '../data/template-compiler-service';
import {RouteFactoryService} from '../routing/route-factory-service';
import {Views} from '../routing/views';


/**
 * Previews layers
 */
@customElement({
  tag: 'pa-asset-layer-preview',
  templateKey: 'src/asset/layer-preview',
})
export class LayerPreview extends BaseThemedElement {
  @bind(null).attribute('layer-id', StringParser)
  readonly layerIdHook_: DomHook<string>;

  @bind('#css').property('innerHTML')
  readonly cssInnerHtmlHook_: DomHook<string>;

  @bind('#root').property('innerHTML')
  readonly rootInnerHtmlHook_: DomHook<string>;

  private readonly assetCollection_: AssetCollection;
  private readonly routeFactoryService_: RouteFactoryService;
  private readonly routeService_: RouteService<Views>;
  private readonly sampleDataService_: SampleDataService;
  private readonly templateCompilerService_: TemplateCompilerService;

  private layerDeregister_: DisposableFunction | null;

  constructor(
      @inject('pa.data.AssetCollection') assetCollection: AssetCollection,
      @inject('pa.routing.RouteFactoryService') routeFactoryService: RouteFactoryService,
      @inject('gs.routing.RouteService') routeService: RouteService<Views>,
      @inject('pa.common.SampleDataService') sampleDataService: SampleDataService,
      @inject('pa.data.TemplateCompilerService') templateCompilerService: TemplateCompilerService,
      @inject('theming.ThemeService') themeService: ThemeService) {
    super(themeService);
    this.assetCollection_ = assetCollection;
    this.cssInnerHtmlHook_ = DomHook.of<string>();
    this.layerDeregister_ = null;
    this.layerIdHook_ = DomHook.of<string>();
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
    this.routeService_.on(RouteServiceEvents.CHANGED, this.onLayerIdChanged_, this);
    this.onLayerIdChanged_();
  }

  private onLayerChange_(asset: Asset, rowData: string[], layer: BaseLayer): void {
    const {css, html} = layer.asHtml();
    const compiler = this.templateCompilerService_.create(asset, rowData);
    this.cssInnerHtmlHook_.set(compiler.compile(css));
    this.rootInnerHtmlHook_.set(compiler.compile(html));
  }

  @handle(null).attributeChange('layer-id')
  @sequenced()
  async onLayerIdChanged_(): Promise<void> {
    if (this.layerDeregister_ !== null) {
      this.layerDeregister_.dispose();
      this.layerDeregister_ = null;
    }
    const params = this.routeService_.getParams(this.routeFactoryService_.layer());
    if (params === null) {
      return;
    }

    const layerId = this.layerIdHook_.get();
    if (layerId === null) {
      return;
    }

    const [asset, rowData] = await Promise.all([
      this.assetCollection_.get(params.projectId, params.assetId),
      this.sampleDataService_.getRowData(),
    ]);
    if (asset === null || rowData === null) {
      return;
    }

    const layer = Arrays
        .of(asset.getLayers())
        .find((layer: BaseLayer) => {
          return layer.getId() === layerId;
        });
    if (layer === null) {
      return;
    }

    this.layerDeregister_ = layer
        .on(DataEvents.CHANGED, this.onLayerChange_.bind(this, asset, rowData, layer), this);
    this.onLayerChange_(asset, rowData, layer);
  }
}

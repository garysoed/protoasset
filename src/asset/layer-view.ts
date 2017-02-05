import {Arrays} from 'external/gs_tools/src/collection';
import {DisposableFunction} from 'external/gs_tools/src/dispose';
import {DomEvent} from 'external/gs_tools/src/event';
import {inject} from 'external/gs_tools/src/inject';
import {IdGenerator, SimpleIdGenerator} from 'external/gs_tools/src/random';
import {Enums} from 'external/gs_tools/src/typescript';
import {Validate} from 'external/gs_tools/src/valid';
import {
  bind,
  customElement,
  DomBridge,
  EnumParser,
  handle,
  IntegerParser,
  StringParser} from 'external/gs_tools/src/webc';

import {BaseThemedElement} from 'external/gs_ui/src/common';
import {RouteService, RouteServiceEvents} from 'external/gs_ui/src/routing';
import {ThemeService} from 'external/gs_ui/src/theming';
import {OverlayService} from 'external/gs_ui/src/tool';

import {Asset} from '../data/asset';
import {AssetCollection} from '../data/asset-collection';
import {BaseLayer} from '../data/base-layer';
import {DataEvents} from '../data/data-events';
import {HtmlLayer} from '../data/html-layer';
import {ImageLayer} from '../data/image-layer';
import {LayerType} from '../data/layer-type';
import {TextLayer} from '../data/text-layer';
import {RouteFactoryService} from '../routing/route-factory-service';
import {Views} from '../routing/views';

import {ImageLayerEditor} from './image-layer-editor';
import {LayerItem} from './layer-item';


type LayerItemData = {assetId: string, layerId: string, projectId: string};


export function layerItemGenerator(document: Document): Element {
  return document.createElement('pa-asset-layer-item');
}

export function layerItemDataSetter(data: LayerItemData, element: Element): void {
  element.setAttribute('asset-id', data.assetId);
  element.setAttribute('layer-id', data.layerId);
  element.setAttribute('project-id', data.projectId);
}


/**
 * Displays layer editor
 */
@customElement({
  dependencies: [ImageLayerEditor, LayerItem],
  tag: 'pa-asset-layer-view',
  templateKey: 'src/asset/layer-view',
})
export class LayerView extends BaseThemedElement {
  @bind('#htmlEditor').attribute('asset-id', StringParser)
  readonly htmlEditorAssetIdBridge_: DomBridge<string>;

  @bind('#htmlEditor').attribute('layer-id', StringParser)
  readonly htmlEditorLayerIdBridge_: DomBridge<string>;

  @bind('#htmlEditor').attribute('project-id', StringParser)
  readonly htmlEditorProjectIdBridge_: DomBridge<string>;

  @bind('#imageEditor').attribute('asset-id', StringParser)
  readonly imageEditorAssetIdBridge_: DomBridge<string>;

  @bind('#imageEditor').attribute('data-row', IntegerParser)
  readonly imageEditorDataRowBridge_: DomBridge<number>;

  @bind('#imageEditor').attribute('layer-id', StringParser)
  readonly imageEditorLayerIdBridge_: DomBridge<string>;

  @bind('#imageEditor').attribute('project-id', StringParser)
  readonly imageEditorProjectIdBridge_: DomBridge<string>;

  @bind('#selectedLayerName').innerText()
  readonly layerNameBridge_: DomBridge<string>;

  @bind('#layerTypeSwitch').attribute('gs-value', EnumParser(LayerType))
  readonly layerTypeSwitchBridge_: DomBridge<LayerType>;

  @bind('#layers').childrenElements<LayerItemData>(layerItemGenerator, layerItemDataSetter)
  readonly layersChildElementHook_: DomBridge<LayerItemData[]>;

  @bind('#textEditor').attribute('asset-id', StringParser)
  readonly textEditorAssetIdBridge_: DomBridge<string>;

  @bind('#textEditor').attribute('layer-id', StringParser)
  readonly textEditorLayerIdBridge_: DomBridge<string>;

  @bind('#textEditor').attribute('project-id', StringParser)
  readonly textEditorProjectIdBridge_: DomBridge<string>;

  private readonly assetCollection_: AssetCollection;
  private readonly layerIdGenerator_: IdGenerator;
  private readonly overlayService_: OverlayService;
  private readonly routeFactoryService_: RouteFactoryService;
  private readonly routeService_: RouteService<Views>;

  private assetChangedDeregister_: DisposableFunction | null;
  private layerChangedDeregister_: DisposableFunction | null;

  constructor(
      @inject('pa.data.AssetCollection') assetCollection: AssetCollection,
      @inject('gs.tool.OverlayService') overlayService: OverlayService,
      @inject('pa.routing.RouteFactoryService') routeFactoryService: RouteFactoryService,
      @inject('gs.routing.RouteService') routeService: RouteService<Views>,
      @inject('theming.ThemeService') themeService: ThemeService) {
    super(themeService);
    this.assetChangedDeregister_ = null;
    this.assetCollection_ = assetCollection;
    this.htmlEditorAssetIdBridge_ = DomBridge.of<string>();
    this.htmlEditorLayerIdBridge_ = DomBridge.of<string>();
    this.htmlEditorProjectIdBridge_ = DomBridge.of<string>();
    this.imageEditorAssetIdBridge_ = DomBridge.of<string>();
    this.imageEditorDataRowBridge_ = DomBridge.of<number>();
    this.imageEditorLayerIdBridge_ = DomBridge.of<string>();
    this.imageEditorProjectIdBridge_ = DomBridge.of<string>();
    this.layerChangedDeregister_ = null;
    this.layerIdGenerator_ = new SimpleIdGenerator();
    this.layerNameBridge_ = DomBridge.of<string>();
    this.layerTypeSwitchBridge_ = DomBridge.of<LayerType>();
    this.layersChildElementHook_ = DomBridge.of<LayerItemData[]>();
    this.overlayService_ = overlayService;
    this.routeFactoryService_ = routeFactoryService;
    this.routeService_ = routeService;
    this.textEditorAssetIdBridge_ = DomBridge.of<string>();
    this.textEditorLayerIdBridge_ = DomBridge.of<string>();
    this.textEditorProjectIdBridge_ = DomBridge.of<string>();
  }

  @handle('#createHtmlLayer').event(DomEvent.CLICK, [LayerType.HTML])
  @handle('#createImageLayer').event(DomEvent.CLICK, [LayerType.IMAGE])
  @handle('#createTextLayer').event(DomEvent.CLICK, [LayerType.TEXT])
  async createLayer_(layerType: LayerType): Promise<void> {
    let params = this.routeService_.getParams<{assetId: string, projectId: string}>(
        this.routeFactoryService_.layer());
    if (params === null) {
      return;
    }

    let asset = await this.assetCollection_.get(params.projectId, params.assetId);
    if (asset === null) {
      return;
    }

    let layers = asset.getLayers();
    let existingIds = new Set(
        Arrays
            .of(layers)
            .map((layer: BaseLayer) => {
              return layer.getId();
            })
            .asArray());
    let id = this.layerIdGenerator_.generate();
    while (existingIds.has(id)) {
      id = this.layerIdGenerator_.resolveConflict(id);
    }

    let name = `New ${Enums.toLowerCaseString(layerType, LayerType)} layer`;
    let layer: BaseLayer;

    switch (layerType) {
      case LayerType.HTML:
        layer = new HtmlLayer(id, name);
        break;
      case LayerType.IMAGE:
        layer = new ImageLayer(id, name);
        break;
      case LayerType.TEXT:
        layer = new TextLayer(id, name);
        break;
      default:
        throw Validate.fail(`Unsupported layer type: ${layerType}`);
    }

    layers.splice(0, 0, layer);
    asset.setLayers(layers);

    this.selectLayer_(layer);
    this.overlayService_.hideOverlay();
    await this.assetCollection_.update(asset);
  }

  /**
   * Handles when the asset was changed.
   * @param asset The changed asset.
   */
  private async onAssetChanged_(asset: Asset): Promise<void> {
    this.htmlEditorAssetIdBridge_.set(asset.getId());
    this.htmlEditorProjectIdBridge_.set(asset.getProjectId());
    this.imageEditorAssetIdBridge_.set(asset.getId());
    this.imageEditorProjectIdBridge_.set(asset.getProjectId());
    this.textEditorAssetIdBridge_.set(asset.getId());
    this.textEditorProjectIdBridge_.set(asset.getProjectId());

    let dataSource = asset.getData();
    if (dataSource === null) {
      return;
    }

    let data = await dataSource.getData();
    if (data.length <= 0) {
      return;
      // TODO: Display error if there are no data.
    }

    // TODO: Let user pick the data row.
    this.imageEditorDataRowBridge_.set(0);

    let layerItemData = Arrays
        .of(asset.getLayers())
        .map((layer: BaseLayer) => {
          return {
            assetId: asset.getId(),
            layerId: layer.getId(),
            projectId: asset.getProjectId(),
          };
        })
        .asArray();
    this.layersChildElementHook_.set(layerItemData);
  }

  /**
   * Handles when the layer was changed.
   * @param layer The changed layer.
   */
  private onLayerChanged_(layer: BaseLayer): void {
    this.layerNameBridge_.set(layer.getName());
    this.layerTypeSwitchBridge_.set(layer.getType());
    this.htmlEditorLayerIdBridge_.set(layer.getId());
    this.imageEditorLayerIdBridge_.set(layer.getId());
    this.textEditorLayerIdBridge_.set(layer.getId());
  }

  /**
   * Handles when the route was changed.
   * @return Promise that will be resolved when all operations are done.
   */
  private async onRouteChanged_(): Promise<void> {
    if (this.assetChangedDeregister_ !== null) {
      this.assetChangedDeregister_.dispose();
      this.assetChangedDeregister_ = null;
    }

    let params = this.routeService_.getParams(this.routeFactoryService_.layer());
    if (params === null) {
      return;
    }

    let asset = await this.assetCollection_.get(params.projectId, params.assetId);
    if (asset === null) {
      return;
    }

    this.assetChangedDeregister_ = asset.on(
        DataEvents.CHANGED,
        this.onAssetChanged_.bind(this, asset),
        this);
    this.onAssetChanged_(asset);

    let layers = asset.getLayers();
    if (layers.length <= 0) {
      await this.createLayer_(LayerType.IMAGE);
      return;
    }

    this.selectLayer_(layers[0]);
  }

  /**
   * Selects the specified layer.
   * @param layer The layer to be selected.
   */
  private selectLayer_(layer: BaseLayer): void {
    if (this.layerChangedDeregister_ !== null) {
      this.layerChangedDeregister_.dispose();
      this.layerChangedDeregister_ = null;
    }
    this.layerChangedDeregister_ = layer.on(
        DataEvents.CHANGED,
        this.onLayerChanged_.bind(this, layer),
        this);
    this.onLayerChanged_(layer);
  }

  /**
   * @override
   */
  disposeInternal(): void {
    if (this.assetChangedDeregister_ !== null) {
      this.assetChangedDeregister_.dispose();
    }

    if (this.layerChangedDeregister_ !== null) {
      this.layerChangedDeregister_.dispose();
    }
    super.disposeInternal();
  }

  /**
   * @override
   */
  onCreated(element: HTMLElement): void {
    super.onCreated(element);

    this.addDisposable(this.routeService_.on(
        RouteServiceEvents.CHANGED,
        this.onRouteChanged_,
        this));
    this.onRouteChanged_();
  }
}

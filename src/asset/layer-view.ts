import {Arrays} from 'external/gs_tools/src/collection';
import {DisposableFunction} from 'external/gs_tools/src/dispose';
import {DomEvent} from 'external/gs_tools/src/event';
import {inject} from 'external/gs_tools/src/inject';
import {IdGenerator, SimpleIdGenerator} from 'external/gs_tools/src/random';
import {Enums} from 'external/gs_tools/src/typescript';
import {Validate} from 'external/gs_tools/src/valid';
import {
  bind,
  BooleanParser,
  customElement,
  DomHook,
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
import {LayerPreview} from './layer-preview';


type LayerItemData = {assetId: string, layerId: string, projectId: string};
type LayerPreviewData = {isSelected: boolean, layerId: string};


export function layerItemDataSetter(data: LayerItemData, element: Element): void {
  element.setAttribute('asset-id', data.assetId);
  element.setAttribute('layer-id', data.layerId);
  element.setAttribute('project-id', data.projectId);
}

export function layerItemGenerator(document: Document): Element {
  return document.createElement('pa-asset-layer-item');
}

export function layerPreviewDataSetter(data: LayerPreviewData, element: Element): void {
  element.setAttribute('is-selected', BooleanParser.stringify(data.isSelected));
  element.setAttribute('layer-id', data.layerId);
}

export function layerPreviewGenerator(document: Document): Element {
  return document.createElement('pa-asset-layer-preview');
}


/**
 * Displays layer editor
 */
@customElement({
  dependencies: [ImageLayerEditor, LayerItem, LayerPreview],
  tag: 'pa-asset-layer-view',
  templateKey: 'src/asset/layer-view',
})
export class LayerView extends BaseThemedElement {
  @bind('#htmlEditor').attribute('asset-id', StringParser)
  readonly htmlEditorAssetIdHook_: DomHook<string>;

  @bind('#htmlEditor').attribute('layer-id', StringParser)
  readonly htmlEditorLayerIdHook_: DomHook<string>;

  @bind('#htmlEditor').attribute('project-id', StringParser)
  readonly htmlEditorProjectIdHook_: DomHook<string>;

  @bind('#imageEditor').attribute('asset-id', StringParser)
  readonly imageEditorAssetIdHook_: DomHook<string>;

  @bind('#imageEditor').attribute('data-row', IntegerParser)
  readonly imageEditorDataRowHook_: DomHook<number>;

  @bind('#imageEditor').attribute('layer-id', StringParser)
  readonly imageEditorLayerIdHook_: DomHook<string>;

  @bind('#imageEditor').attribute('project-id', StringParser)
  readonly imageEditorProjectIdHook_: DomHook<string>;

  @bind('#selectedLayerName').innerText()
  readonly layerNameHook_: DomHook<string>;

  @bind('#previews').childrenElements(layerPreviewGenerator, layerPreviewDataSetter)
  readonly layerPreviewsChildElementHook_: DomHook<LayerPreviewData[]>;

  @bind('#layerTypeSwitch').attribute('gs-value', EnumParser(LayerType))
  readonly layerTypeSwitchHook_: DomHook<LayerType>;

  @bind('#layers').childrenElements<LayerItemData>(layerItemGenerator, layerItemDataSetter)
  readonly layersChildElementHook_: DomHook<LayerItemData[]>;

  @bind('#textEditor').attribute('asset-id', StringParser)
  readonly textEditorAssetIdHook_: DomHook<string>;

  @bind('#textEditor').attribute('layer-id', StringParser)
  readonly textEditorLayerIdHook_: DomHook<string>;

  @bind('#textEditor').attribute('project-id', StringParser)
  readonly textEditorProjectIdHook_: DomHook<string>;

  private readonly assetCollection_: AssetCollection;
  private readonly layerIdGenerator_: IdGenerator;
  private readonly overlayService_: OverlayService;
  private readonly routeFactoryService_: RouteFactoryService;
  private readonly routeService_: RouteService<Views>;

  private assetChangedDeregister_: DisposableFunction | null;
  private layerChangedDeregister_: DisposableFunction | null;
  private selectedLayerId_: string | null;

  constructor(
      @inject('pa.data.AssetCollection') assetCollection: AssetCollection,
      @inject('gs.tool.OverlayService') overlayService: OverlayService,
      @inject('pa.routing.RouteFactoryService') routeFactoryService: RouteFactoryService,
      @inject('gs.routing.RouteService') routeService: RouteService<Views>,
      @inject('theming.ThemeService') themeService: ThemeService) {
    super(themeService);
    this.assetChangedDeregister_ = null;
    this.assetCollection_ = assetCollection;
    this.htmlEditorAssetIdHook_ = DomHook.of<string>();
    this.htmlEditorLayerIdHook_ = DomHook.of<string>();
    this.htmlEditorProjectIdHook_ = DomHook.of<string>();
    this.imageEditorAssetIdHook_ = DomHook.of<string>();
    this.imageEditorDataRowHook_ = DomHook.of<number>();
    this.imageEditorLayerIdHook_ = DomHook.of<string>();
    this.imageEditorProjectIdHook_ = DomHook.of<string>();
    this.layerChangedDeregister_ = null;
    this.layerIdGenerator_ = new SimpleIdGenerator();
    this.layerNameHook_ = DomHook.of<string>();
    this.layerPreviewsChildElementHook_ = DomHook.of<LayerPreviewData[]>();
    this.layerTypeSwitchHook_ = DomHook.of<LayerType>();
    this.layersChildElementHook_ = DomHook.of<LayerItemData[]>();
    this.overlayService_ = overlayService;
    this.routeFactoryService_ = routeFactoryService;
    this.routeService_ = routeService;
    this.selectedLayerId_ = null;
    this.textEditorAssetIdHook_ = DomHook.of<string>();
    this.textEditorLayerIdHook_ = DomHook.of<string>();
    this.textEditorProjectIdHook_ = DomHook.of<string>();
  }

  @handle('#createHtmlLayer').event(DomEvent.CLICK, [LayerType.HTML])
  @handle('#createImageLayer').event(DomEvent.CLICK, [LayerType.IMAGE])
  @handle('#createTextLayer').event(DomEvent.CLICK, [LayerType.TEXT])
  async createLayer_(layerType: LayerType): Promise<void> {
    const asset = await this.getAsset_();
    if (asset === null) {
      return;
    }
    const layers = asset.getLayers();
    const existingIds = new Set(
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

    const name = `New ${Enums.toLowerCaseString(layerType, LayerType)} layer`;
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
   * @return Promise that will be resolved with the selected asset, or null if it does not exist.
   */
  private async getAsset_(): Promise<Asset | null> {
    const params = this.routeService_.getParams<{assetId: string, projectId: string}>(
        this.routeFactoryService_.layer());
    if (params === null) {
      return null;
    }

    return await this.assetCollection_.get(params.projectId, params.assetId);
  }

  /**
   * Handles when the asset was changed.
   * @param asset The changed asset.
   */
  private async onAssetChanged_(asset: Asset): Promise<void> {
    this.htmlEditorAssetIdHook_.set(asset.getId());
    this.htmlEditorProjectIdHook_.set(asset.getProjectId());
    this.imageEditorAssetIdHook_.set(asset.getId());
    this.imageEditorProjectIdHook_.set(asset.getProjectId());
    this.textEditorAssetIdHook_.set(asset.getId());
    this.textEditorProjectIdHook_.set(asset.getProjectId());

    const dataSource = asset.getData();
    if (dataSource === null) {
      return;
    }

    const data = await dataSource.getData();
    if (data.length <= 0) {
      return;
      // TODO: Display error if there are no data.
    }

    // TODO: Let user pick the data row.
    this.imageEditorDataRowHook_.set(0);

    const layerItemData = Arrays
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
    this.updateLayerPreviews_();
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

  /**
   * Handles when the layer was changed.
   * @param layer The changed layer.
   */
  private onLayerChanged_(layer: BaseLayer): void {
    this.layerNameHook_.set(layer.getName());
    this.layerTypeSwitchHook_.set(layer.getType());
    this.htmlEditorLayerIdHook_.set(layer.getId());
    this.imageEditorLayerIdHook_.set(layer.getId());
    this.textEditorLayerIdHook_.set(layer.getId());
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

  private async updateLayerPreviews_(): Promise<void> {
    const asset = await this.getAsset_();
    if (asset === null) {
      return;
    }

    const layerPreviewData = Arrays
        .of(asset.getLayers())
        .map((layer: BaseLayer) => {
          const layerId = layer.getId();
          return {
            isSelected: layerId === this.selectedLayerId_,
            layerId: layerId,
          };
        })
        .asArray();
    this.layerPreviewsChildElementHook_.set(layerPreviewData);
  }
}

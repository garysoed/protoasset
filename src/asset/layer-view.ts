import {Arrays} from 'external/gs_tools/src/collection';
import {DomEvent} from 'external/gs_tools/src/event';
import {inject} from 'external/gs_tools/src/inject';
import {Validate} from 'external/gs_tools/src/valid';
import {IdGenerator, SimpleIdGenerator} from 'external/gs_tools/src/random';
import {Enums} from 'external/gs_tools/src/typescript';
import {
  bind,
  customElement,
  DomBridge,
  EnumParser,
  handle,
  StringParser} from 'external/gs_tools/src/webc';

import {BaseThemedElement} from 'external/gs_ui/src/common';
import {RouteService, RouteServiceEvents} from 'external/gs_ui/src/routing';
import {ThemeService} from 'external/gs_ui/src/theming';
import {OverlayService} from 'external/gs_ui/src/tool';

import {Asset} from '../data/asset';
import {AssetCollection} from '../data/asset-collection';
import {BaseLayer} from '../data/base-layer';
import {HtmlLayer} from '../data/html-layer';
import {ImageLayer} from '../data/image-layer';
import {LayerType} from '../data/layer-type';
import {TextLayer} from '../data/text-layer';
import {RouteFactoryService} from '../routing/route-factory-service';
import {Views} from '../routing/views';


/**
 * Displays layer editor
 */
@customElement({
  tag: 'pa-asset-layer-view',
  templateKey: 'src/asset/layer-view',
})
export class LayerView extends BaseThemedElement {
  @bind('#selectedLayerName').innerText()
  private readonly layerNameBridge_: DomBridge<string>;

  @bind('#layerTypeSwitch').attribute('gs-value', EnumParser(LayerType))
  private readonly layerTypeSwitchBridge_: DomBridge<LayerType>;

  private readonly assetCollection_: AssetCollection;
  private readonly layerIdGenerator_: IdGenerator;
  private readonly overlayService_: OverlayService;
  private readonly routeFactoryService_: RouteFactoryService;
  private readonly routeService_: RouteService<Views>;

  constructor(
      @inject('pa.data.AssetCollection') assetCollection: AssetCollection,
      @inject('gs.tool.OverlayService') overlayService: OverlayService,
      @inject('pa.routing.RouteFactoryService') routeFactoryService: RouteFactoryService,
      @inject('gs.routing.RouteService') routeService: RouteService<Views>,
      @inject('theming.ThemeService') themeService: ThemeService) {
    super(themeService);
    this.assetCollection_ = assetCollection;
    this.layerIdGenerator_ = new SimpleIdGenerator();
    this.layerNameBridge_ = DomBridge.of<string>();
    this.layerTypeSwitchBridge_ = DomBridge.of<LayerType>();
    this.overlayService_ = overlayService;
    this.routeFactoryService_ = routeFactoryService;
    this.routeService_ = routeService;
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
   * Selects the specified layer.
   * @param layer The layer to be selected.
   */
  private selectLayer_(layer: BaseLayer): void {
    this.layerNameBridge_.set(layer.getName());
    this.layerTypeSwitchBridge_.set(layer.getType());
  }
}

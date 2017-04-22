import { atomic } from 'external/gs_tools/src/async';
import { Arrays } from 'external/gs_tools/src/collection';
import { DisposableFunction } from 'external/gs_tools/src/dispose';
import { DomEvent, ListenableDom } from 'external/gs_tools/src/event';
import { inject } from 'external/gs_tools/src/inject';
import {
  BooleanParser,
  EnumParser,
  IntegerParser,
  StringParser } from 'external/gs_tools/src/parse';
import { BaseIdGenerator, SimpleIdGenerator } from 'external/gs_tools/src/random';
import { Enums } from 'external/gs_tools/src/typescript';
import { Validate } from 'external/gs_tools/src/valid';
import {
  ChildElementDataHelper,
  customElement,
  DomHook,
  handle,
  hook } from 'external/gs_tools/src/webc';

import { BaseThemedElement } from 'external/gs_ui/src/common';
import { RouteService, RouteServiceEvents } from 'external/gs_ui/src/routing';
import { ThemeService } from 'external/gs_ui/src/theming';
import { MenuItem, OverlayService } from 'external/gs_ui/src/tool';

import { BaseLayerEditor } from '../asset/base-layer-editor';
import { HtmlLayerEditor } from '../asset/html-layer-editor';
import { ImageLayerEditor } from '../asset/image-layer-editor';
import { LayerItem } from '../asset/layer-item';
import { LayerPreview } from '../asset/layer-preview';
import { TextLayerEditor } from '../asset/text-layer-editor';
import { SampleDataPicker } from '../common/sample-data-picker';
import { SampleDataService } from '../common/sample-data-service';
import { Asset } from '../data/asset';
import { AssetCollection } from '../data/asset-collection';
import { BaseLayer } from '../data/base-layer';
import { DataEvents } from '../data/data-events';
import { HtmlLayer } from '../data/html-layer';
import { ImageLayer } from '../data/image-layer';
import { LayerPreviewMode } from '../data/layer-preview-mode';
import { LayerType } from '../data/layer-type';
import { TextLayer } from '../data/text-layer';
import { RenderService } from '../render/render-service';
import { RouteFactoryService } from '../routing/route-factory-service';
import { Views } from '../routing/views';


type LayerItemData = {assetId: string, layerId: string, projectId: string};
type LayerPreviewData = {isSelected: boolean, layerId: string, mode: LayerPreviewMode};


export const LAYER_ITEM_DATA_HELPER: ChildElementDataHelper<LayerItemData> = {
  /**
   * @override
   */
  create(document: Document, instance: LayerView): Element {
    const element = document.createElement('pa-asset-layer-item');
    const listenableDom = ListenableDom.of(element);
    instance.listenTo(
        listenableDom,
        DomEvent.CLICK,
        () => {
          instance.onLayerItemClick_(element.getAttribute('layer-id'));
        });
    instance.addDisposable(listenableDom);
    return element;
  },

  /**
   * @override
   */
  get(element: Element): LayerItemData | null {
    const assetId = element.getAttribute('asset-id');
    const layerId = element.getAttribute('layer-id');
    const projectId = element.getAttribute('project-id');

    if (assetId === null || layerId === null || projectId === null) {
      return null;
    }

    return {assetId, layerId, projectId};
  },

  /**
   * @override
   */
  set(data: LayerItemData, element: Element): void {
    element.setAttribute('asset-id', data.assetId);
    element.setAttribute('layer-id', data.layerId);
    element.setAttribute('project-id', data.projectId);
  },
};


export const LAYER_PREVIEW_DATA_HELPER: ChildElementDataHelper<LayerPreviewData> = {
  /**
   * @override
   */
  create(document: Document): Element {
    return document.createElement('pa-asset-layer-preview');
  },

  /**
   * @override
   */
  get(element: Element): LayerPreviewData | null {
    const isSelected = BooleanParser.parse(element.getAttribute('is-selected'));
    const layerId = element.getAttribute('layer-id');
    const previewMode = EnumParser<LayerPreviewMode>(LayerPreviewMode)
        .parse(element.getAttribute('preview-mode'));

    if (isSelected === null || layerId === null || previewMode === null) {
      return null;
    }

    return {isSelected, layerId, mode: previewMode};
  },

  /**
   * @override
   */
  set(data: LayerPreviewData, element: Element): void {
    element.setAttribute('is-selected', BooleanParser.stringify(data.isSelected));
    element.setAttribute('layer-id', data.layerId);
    element.setAttribute('preview-mode', EnumParser(LayerPreviewMode).stringify(data.mode));
  },
};


export const LAYER_PREVIEW_MODE_DATA_HELPER: ChildElementDataHelper<LayerPreviewMode> = {
  /**
   * @override
   */
  create(document: Document, instance: LayerView): Element {
    const element = document.createElement('gs-menu-item');
    const listenableDom = ListenableDom.of(element);
    instance.listenTo(listenableDom, DomEvent.CLICK, instance.onLayerPreviewModeSelected_);
    instance.addDisposable(listenableDom);
    return element;
  },

  /**
   * @override
   */
  get(element: Element): LayerPreviewMode | null {
    return EnumParser<LayerPreviewMode>(LayerPreviewMode).parse(element.getAttribute('gs-value'));
  },

  /**
   * @override
   */
  set(data: LayerPreviewMode, element: Element): void {
    element.setAttribute('gs-content', Enums.toLowerCaseString(data, LayerPreviewMode));
    element.setAttribute('gs-value', EnumParser(LayerPreviewMode).stringify(data));
  },
};


/**
 * Displays layer editor
 */
@customElement({
  dependencies: [
    BaseLayerEditor,
    HtmlLayerEditor,
    ImageLayerEditor,
    LayerItem,
    LayerPreview,
    MenuItem,
    RenderService,
    SampleDataPicker,
    TextLayerEditor,
  ],
  tag: 'pa-asset-layer-view',
  templateKey: 'src/asset/layer-view',
})
export class LayerView extends BaseThemedElement {
  @hook('#baseEditor').attribute('asset-id', StringParser)
  readonly baseEditorAssetIdHook_: DomHook<string>;

  @hook('#baseEditor').attribute('layer-id', StringParser)
  readonly baseEditorLayerIdHook_: DomHook<string>;

  @hook('#baseEditor').attribute('project-id', StringParser)
  readonly baseEditorProjectIdHook_: DomHook<string>;

  @hook('#htmlEditor').attribute('asset-id', StringParser)
  readonly htmlEditorAssetIdHook_: DomHook<string>;

  @hook('#htmlEditor').attribute('layer-id', StringParser)
  readonly htmlEditorLayerIdHook_: DomHook<string>;

  @hook('#htmlEditor').attribute('project-id', StringParser)
  readonly htmlEditorProjectIdHook_: DomHook<string>;

  @hook('#imageEditor').attribute('asset-id', StringParser)
  readonly imageEditorAssetIdHook_: DomHook<string>;

  @hook('#imageEditor').attribute('data-row', IntegerParser)
  readonly imageEditorDataRowHook_: DomHook<number>;

  @hook('#imageEditor').attribute('layer-id', StringParser)
  readonly imageEditorLayerIdHook_: DomHook<string>;

  @hook('#imageEditor').attribute('project-id', StringParser)
  readonly imageEditorProjectIdHook_: DomHook<string>;

  @hook('#imageRender').attribute('src', StringParser)
  readonly imageRenderSrcHook_: DomHook<string>;

  @hook('#selectedLayerName').innerText()
  readonly layerNameHook_: DomHook<string>;

  @hook('#previews').childrenElements(LAYER_PREVIEW_DATA_HELPER)
  readonly layerPreviewsChildElementHook_: DomHook<LayerPreviewData[]>;

  @hook('#previews').property('style')
  readonly layerPreviewsStyleHook_: DomHook<CSSStyleDeclaration>;

  @hook('#layerTypeSwitch').attribute('gs-value', EnumParser(LayerType))
  readonly layerTypeSwitchHook_: DomHook<LayerType>;

  @hook('#layers').childrenElements<LayerItemData>(LAYER_ITEM_DATA_HELPER)
  readonly layersChildElementHook_: DomHook<LayerItemData[]>;

  @hook('#previewModes').childrenElements(LAYER_PREVIEW_MODE_DATA_HELPER)
  readonly previewModeChildElementHook_: DomHook<LayerPreviewMode[]>;

  @hook('#previewSwitch').attribute('gs-value', BooleanParser)
  readonly previewSwitchHook_: DomHook<boolean>;

  // TODO: Add parser to innerText.
  @hook('#selectedPreviewMode').innerText()
  readonly selectedPreviewModeHook_: DomHook<string>;

  @hook('#textEditor').attribute('asset-id', StringParser)
  readonly textEditorAssetIdHook_: DomHook<string>;

  @hook('#textEditor').attribute('layer-id', StringParser)
  readonly textEditorLayerIdHook_: DomHook<string>;

  @hook('#textEditor').attribute('project-id', StringParser)
  readonly textEditorProjectIdHook_: DomHook<string>;

  private readonly assetCollection_: AssetCollection;
  private readonly layerIdGenerator_: BaseIdGenerator;
  private readonly overlayService_: OverlayService;
  private readonly renderService_: RenderService;
  private readonly routeFactoryService_: RouteFactoryService;
  private readonly routeService_: RouteService<Views>;
  private readonly sampleDataService_: SampleDataService;

  private assetChangedDeregister_: DisposableFunction | null;
  private layerChangedDeregister_: DisposableFunction | null;
  private selectedLayerId_: string | null;
  private selectedLayerPreviewMode_: LayerPreviewMode;

  constructor(
      @inject('pa.data.AssetCollection') assetCollection: AssetCollection,
      @inject('gs.tool.OverlayService') overlayService: OverlayService,
      @inject('pa.render.RenderService') renderService: RenderService,
      @inject('pa.routing.RouteFactoryService') routeFactoryService: RouteFactoryService,
      @inject('gs.routing.RouteService') routeService: RouteService<Views>,
      @inject('pa.common.SampleDataService') sampleDataService: SampleDataService,
      @inject('theming.ThemeService') themeService: ThemeService) {
    super(themeService);
    this.assetChangedDeregister_ = null;
    this.assetCollection_ = assetCollection;
    this.baseEditorAssetIdHook_ = DomHook.of<string>();
    this.baseEditorLayerIdHook_ = DomHook.of<string>();
    this.baseEditorProjectIdHook_ = DomHook.of<string>();
    this.htmlEditorAssetIdHook_ = DomHook.of<string>();
    this.htmlEditorLayerIdHook_ = DomHook.of<string>();
    this.htmlEditorProjectIdHook_ = DomHook.of<string>();
    this.imageEditorAssetIdHook_ = DomHook.of<string>();
    this.imageEditorDataRowHook_ = DomHook.of<number>();
    this.imageEditorLayerIdHook_ = DomHook.of<string>();
    this.imageEditorProjectIdHook_ = DomHook.of<string>();
    this.imageRenderSrcHook_ = DomHook.of<string>();
    this.layerChangedDeregister_ = null;
    this.layerIdGenerator_ = new SimpleIdGenerator();
    this.layerNameHook_ = DomHook.of<string>();
    this.layerPreviewsChildElementHook_ = DomHook.of<LayerPreviewData[]>();
    this.layerPreviewsStyleHook_ = DomHook.of<CSSStyleDeclaration>();
    this.layerTypeSwitchHook_ = DomHook.of<LayerType>();
    this.layersChildElementHook_ = DomHook.of<LayerItemData[]>();
    this.overlayService_ = overlayService;
    this.previewModeChildElementHook_ = DomHook.of<LayerPreviewMode[]>();
    this.previewSwitchHook_ = DomHook.of<boolean>();
    this.renderService_ = renderService;
    this.routeFactoryService_ = routeFactoryService;
    this.routeService_ = routeService;
    this.sampleDataService_ = sampleDataService;
    this.selectedLayerId_ = null;
    this.selectedLayerPreviewMode_ = LayerPreviewMode.NORMAL;
    this.selectedPreviewModeHook_ = DomHook.of<string>();
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
    const id = this.layerIdGenerator_.generate(asset.getLayerIds());
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

    asset.insertLayer(layer);

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
    this.baseEditorAssetIdHook_.set(asset.getId());
    this.baseEditorProjectIdHook_.set(asset.getProjectId());
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

    const style = this.layerPreviewsStyleHook_.get();
    if (style !== null) {
      style.height = `${asset.getHeight()}px`;
      style.width = `${asset.getWidth()}px`;
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

    // Check if the currently selected layer exists.
    const layers = asset.getLayers();
    const layer = Arrays
        .of(layers)
        .find((layer: BaseLayer) => {
          return layer.getId() === this.selectedLayerId_;
        });
    if (layer === null) {
      this.selectDefaultLayer_(asset);
    }
  }

  /**
   * @override
   */
  onCreated(element: HTMLElement): void {
    super.onCreated(element);

    this.listenTo(
        this.routeService_,
        RouteServiceEvents.CHANGED,
        this.onRouteChanged_);
    this.onRouteChanged_();

    this.onSelectedLayerPreviewModeChanged_();
  }

  /**
   * Handles when the layer was changed.
   * @param layer The changed layer.
   */
  private onLayerChanged_(layer: BaseLayer): void {
    this.layerNameHook_.set(layer.getName());
    this.layerTypeSwitchHook_.set(layer.getType());
    this.baseEditorLayerIdHook_.set(layer.getId());
    this.htmlEditorLayerIdHook_.set(layer.getId());
    this.imageEditorLayerIdHook_.set(layer.getId());
    this.textEditorLayerIdHook_.set(layer.getId());
  }

  /**
   * Handles event when layer item is clicked.
   */
  async onLayerItemClick_(layerId: string | null): Promise<void> {
    this.overlayService_.hideOverlay();
    if (layerId === null) {
      return;
    }

    const asset = await this.getAsset_();
    if (asset === null) {
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

    this.selectLayer_(layer);
  }

  /**
   * Handles when the layer preview mode is selected.
   * @param event Event triggered.
   */
  onLayerPreviewModeSelected_(event: Event): void {
    const target = <HTMLElement> event.target;
    const previewMode = EnumParser<LayerPreviewMode>(LayerPreviewMode)
        .parse(target.getAttribute('gs-value'));
    if (previewMode === null) {
      return;
    }

    this.selectedLayerPreviewMode_ = previewMode;
    this.onSelectedLayerPreviewModeChanged_();
    this.updateLayerPreviews_();
    this.overlayService_.hideOverlay();
  }

  /**
   * Handles when the route was changed.
   * @return Promise that will be resolved when all operations are done.
   */
  @atomic()
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

    this.assetChangedDeregister_ = this.listenTo(
        asset,
        DataEvents.CHANGED,
        this.onAssetChanged_.bind(this, asset));
    this.onAssetChanged_(asset);
    this.selectDefaultLayer_(asset);
  }

  private onSelectedLayerPreviewModeChanged_(): void {
    const previewModes = Arrays
        .of([this.selectedLayerPreviewMode_])
        .addAllArray(Arrays
            .of(Enums.getAllValues<LayerPreviewMode>(LayerPreviewMode))
            .removeAll(new Set([this.selectedLayerPreviewMode_]))
            .asArray())
        .asArray();
    this.previewModeChildElementHook_.set(previewModes);
    this.selectedPreviewModeHook_
        .set(EnumParser(LayerPreviewMode).stringify(this.selectedLayerPreviewMode_));
  }

  /**
   * Selects a default layer, or create a new layer and select it if there are no layers in the
   * given asset.
   * @param asset The asset to select the default layer in.
   */
  private selectDefaultLayer_(asset: Asset): void {
    let layers = asset.getLayers();
    if (layers.length <= 0) {
      this.createLayer_(LayerType.IMAGE);
    } else {
      this.selectLayer_(layers[0]);
    }
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
    this.layerChangedDeregister_ = this.listenTo(
        layer,
        DataEvents.CHANGED,
        this.onLayerChanged_.bind(this, layer));

    this.selectedLayerId_ = layer.getId();
    this.onLayerChanged_(layer);
    this.updateLayerPreviews_();
  }

  @handle('#refreshButton').event(DomEvent.CLICK)
  async updateLayerPreviews_(): Promise<void> {
    const asset = await this.getAsset_();
    if (asset === null) {
      return;
    }

    const isRenderMode = this.selectedLayerPreviewMode_ === LayerPreviewMode.RENDER;
    this.previewSwitchHook_.set(isRenderMode);

    if (isRenderMode) {
      const sampleData = await this.sampleDataService_.getRowData();
      if (sampleData === null) {
        return;
      }

      const uri = await this.renderService_.render(asset, sampleData);
      if (uri === null) {
        return;
      }

      this.imageRenderSrcHook_.set(uri);
    } else {
      const layerPreviewData = Arrays
          .of(asset.getLayers())
          .map((layer: BaseLayer) => {
            const layerId = layer.getId();
            return {
              isSelected: layerId === this.selectedLayerId_,
              layerId: layerId,
              mode: this.selectedLayerPreviewMode_,
            };
          })
          .reverse()
          .asArray();
      this.layerPreviewsChildElementHook_.set(layerPreviewData);
    }
  }
}

import { DataAccess } from 'external/gs_tools/src/datamodel';
import { monad } from 'external/gs_tools/src/event';
import { ImmutableSet } from 'external/gs_tools/src/immutable';
import { inject } from 'external/gs_tools/src/inject';
import { MonadSetter, MonadValue } from 'external/gs_tools/src/interfaces';
import { StringParser } from 'external/gs_tools/src/parse';
import { customElement, dom, domOut, onDom } from 'external/gs_tools/src/webc';

import { BaseThemedElement2 } from 'external/gs_ui/src/common';
import { RouteService } from 'external/gs_ui/src/routing';
import { ThemeService } from 'external/gs_ui/src/theming';

import { AssetManager } from '../data/asset-manager';
import { Asset2 } from '../data/asset2';
import { RouteFactoryService } from '../routing/route-factory-service';
import { Views } from '../routing/views';

const ASSET_NAME_EL = '#assetName';

const ASSET_NAME_INNER_TEXT = {parser: StringParser, selector: ASSET_NAME_EL};

const ASSET_ID_ATTR = {name: 'asset-id', parser: StringParser, selector: null};
const PROJECT_ID_ATTR = {name: 'project-id', parser: StringParser, selector: null};

/**
 * Displays an asset item.
 */
@customElement({
  tag: 'pa-asset-item',
  templateKey: 'src/project/asset-item',
})
export class AssetItem extends BaseThemedElement2 {
  private readonly routeFactoryService_: RouteFactoryService;
  private readonly routeService_: RouteService<Views>;

  constructor(
      @inject('pa.routing.RouteFactoryService') routeFactoryService: RouteFactoryService,
      @inject('gs.routing.RouteService') routeService: RouteService<Views>,
      @inject('theming.ThemeService') themeService: ThemeService) {
    super(themeService);
    this.routeFactoryService_ = routeFactoryService;
    this.routeService_ = routeService;
  }

  @onDom.event(null, 'click')
  onElementClicked_(
      @dom.attribute(ASSET_ID_ATTR) assetId: string | null,
      @dom.attribute(PROJECT_ID_ATTR) projectId: string | null): void {
    if (assetId !== null && projectId !== null) {
      this.routeService_.goTo(
          this.routeFactoryService_.assetMain(),
          {assetId: assetId, projectId: projectId});
    }
  }

  @onDom.attributeChange(ASSET_ID_ATTR)
  @onDom.attributeChange(PROJECT_ID_ATTR)
  async onIdsChanged_(
      @dom.attribute(ASSET_ID_ATTR) assetId: string | null,
      @domOut.innerText(ASSET_NAME_INNER_TEXT) assetNameSetter: MonadSetter<string | null>,
      @monad(AssetManager.monad()) assetManager: DataAccess<Asset2>):
      Promise<Iterable<MonadValue<any>>> {
    if (assetId === null) {
      return ImmutableSet.of([assetNameSetter.set(null)]);
    }

    const asset = await assetManager.get(assetId);
    if (asset !== null) {
      return ImmutableSet.of([assetNameSetter.set(asset.getName())]);
    }

    return ImmutableSet.of([]);
  }
}

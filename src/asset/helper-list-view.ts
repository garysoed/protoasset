import {DomEvent} from 'external/gs_tools/src/event';
import {inject} from 'external/gs_tools/src/inject';
import {IdGenerator, SimpleIdGenerator} from 'external/gs_tools/src/random';
import {customElement, handle} from 'external/gs_tools/src/webc';

import {BaseThemedElement} from 'external/gs_ui/src/common';
import {RouteService} from 'external/gs_ui/src/routing';
import {ThemeService} from 'external/gs_ui/src/theming';

import {Asset} from '../data/asset';
import {AssetCollection} from '../data/asset-collection';
import {Helper} from '../data/helper';
import {RouteFactoryService} from '../routing/route-factory-service';
import {Views} from '../routing/views';


/**
 * Helper list view
 */
@customElement({
  tag: 'pa-asset-helper-list-view',
  templateKey: 'src/asset/helper-list-view',
})
export class HelperListView extends BaseThemedElement {
  private readonly assetCollection_: AssetCollection;
  private readonly helperIdGenerator_: IdGenerator;
  private readonly routeFactoryService_: RouteFactoryService;
  private readonly routeService_: RouteService<Views>;

  constructor(
      @inject('pa.data.AssetCollection') assetCollection: AssetCollection,
      @inject('pa.routing.RouteFactoryService') routeFactoryService: RouteFactoryService,
      @inject('gs.routing.RouteService') routeService: RouteService<Views>,
      @inject('theming.ThemeService') themeService: ThemeService) {
    super(themeService);
    this.assetCollection_ = assetCollection;
    this.helperIdGenerator_ = new SimpleIdGenerator();
    this.routeFactoryService_ = routeFactoryService;
    this.routeService_ = routeService;
  }

  @handle('#createButton').event(DomEvent.CLICK)
  protected onCreateButtonClick_(): Promise<void> {
    const params = this.routeService_
        .getParams<{assetId: string, projectId: string}>(this.routeFactoryService_.helperList());
    if (params === null) {
      return Promise.resolve();
    }

    return this.assetCollection_
        .get(params.projectId, params.assetId)
        .then((asset: Asset | null) => {
          if (asset === null) {
            return Promise.resolve([null]);
          }

          let helpers = asset.getHelpers();
          let newHelperId = this.helperIdGenerator_.generate();
          while (helpers[newHelperId] !== undefined) {
            newHelperId = this.helperIdGenerator_.resolveConflict(newHelperId);
          }

          let helper = Helper.of(newHelperId, `Helper ${newHelperId}`);
          helpers[newHelperId] = helper;
          asset.setHelpers(helpers);

          return Promise.all([
            newHelperId,
            this.assetCollection_.update(asset, params.projectId),
          ]);
        })
        .then(([helperId, ]: [string | null, any]) => {
          if (helperId === null) {
            return;
          }

          this.routeService_.goTo<{assetId: string, helperId: string, projectId: string}>(
              this.routeFactoryService_.helper(),
              {
                assetId: params.assetId,
                helperId: helperId,
                projectId: params.projectId,
              });
        });
  }
}
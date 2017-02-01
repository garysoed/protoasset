import {AbstractRouteFactory} from 'external/gs_ui/src/routing';

import {AssetCollection} from '../data/asset-collection';
import {Views} from './views';


type CP = {helperId: string};
type PR = {assetId: string, projectId: string};
type CR = CP & PR;


export class HelperRouteFactory extends AbstractRouteFactory<Views, CP, CR, PR> {
  private readonly assetCollection_: AssetCollection;

  constructor(
      assetCollection: AssetCollection,
      parent: AbstractRouteFactory<Views, any, PR, any>) {
    super(Views.HELPER, parent);
    this.assetCollection_ = assetCollection;
  }

  /**
   * @override
   */
  protected getRelativeMatcher_(): string {
    return `/edit/:helperId`;
  }

  /**
   * @override
   */
  protected getRelativePath_(params: CP): string {
    return `/edit/${params.helperId}`;
  }

  /**
   * @override
   */
  getRelativeMatchParams_(matches: {[key: string]: string}): CP {
    return {helperId: matches['helperId']};
  }

  /**
   * @override
   */
  async getName(params: CR): Promise<string> {
    let asset = await this.assetCollection_.get(params.projectId, params.assetId);
    if (asset === null) {
      return `Unknown helper for asset ${params.assetId}`;
    }

    let helper = asset.getHelper(params.helperId);
    if (helper === null) {
      return `Unknown helper ${params.helperId}`;
    }

    return helper.getName();
  }
}

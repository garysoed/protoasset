import {AbstractRouteFactory} from 'external/gs_ui/src/routing';

import {Views} from '../routing/views';


type CreateAssetParams = {projectId: string};


export class CreateAssetRouteFactory extends
    AbstractRouteFactory<Views, CreateAssetParams, {}> {

  constructor(parent: AbstractRouteFactory<Views, any, CreateAssetParams>) {
    super(Views.CREATE_ASSET, parent);
  }

  /**
   * @override
   */
  protected getRelativeMatchParams_(matches: {[key: string]: string}): {} {
    return {};
  }

  /**
   * @override
   */
  protected getRelativeMatcher_(): string {
    return '/create';
  }

  /**
   * @override
   */
  protected getRelativePath_(params: CreateAssetParams): string {
    return '/create';
  }

  /**
   * @override
   */
  getName(params: CreateAssetParams): Promise<string> {
    return Promise.resolve('Create asset');
  }
}

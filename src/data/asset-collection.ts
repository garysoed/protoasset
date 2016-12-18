import {BaseListenable} from 'external/gs_tools/src/event';
import {bind, inject} from 'external/gs_tools/src/inject';
import {LocalStorage} from 'external/gs_tools/src/store';

import {Asset} from './asset';
import {CollectionEvents} from './collection-events';


/**
 * Provides collection of assets.
 */
@bind('pa.data.AssetCollection')
export class AssetCollection extends BaseListenable<CollectionEvents> {
  private storage_: LocalStorage<Asset>;

  constructor(@inject('x.dom.window') window: Window) {
    super();
    this.storage_ = new LocalStorage<Asset>(window, 'pa.assets');
  }

  /**
   * Finds an ID for the asset that is guaranteed to be unique.
   *
   * @param projectId ID of the project that the asset belongs to.
   * @return Promise that will be returned with the asset ID that is guaranteed to be unique.
   */
  reserveId(projectId: string): Promise<string> {
    return this.storage_.generateId()
        .then((id: string) => {
          return `${projectId}_${id}`;
        });
  }

  /**
   * Saves the given asset.
   *
   * @param asset The asset to persist in the storage.
   * @return Promise that will be resolved when the update operation is completed.
   */
  update(asset: Asset): Promise<void> {
    return this.storage_
        .read(asset.getId())
        .then((existingAsset: Asset | null) => {
          return Promise.all([
            existingAsset === null,
            this.storage_.update(asset.getId(), asset),
          ]);
        })
        .then(([isNewAsset]: [boolean, void]) => {
          if (isNewAsset) {
            this.dispatch(CollectionEvents.ADDED, () => undefined, asset);
          }
        });
  }
}

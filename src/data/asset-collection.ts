import {BaseListenable} from 'external/gs_tools/src/event';
import {bind, inject} from 'external/gs_tools/src/inject';
import {LocalStorage} from 'external/gs_tools/src/store';

import {Asset} from './asset';
import {CollectionEvents} from './collection-events';


type ProjectId = string;

/**
 * Provides collection of assets.
 */
@bind('pa.data.AssetCollection')
export class AssetCollection extends BaseListenable<CollectionEvents> {
  private readonly storageMap_: Map<ProjectId, LocalStorage<Asset>>;
  private readonly window_: Window;

  constructor(@inject('x.dom.window') window: Window) {
    super();
    this.storageMap_ = new Map();
    this.window_ = window;
  }

  /**
   * @param projectId
   * @return The storage for the given project ID
   */
  private getStorage_(projectId: ProjectId): LocalStorage<Asset> {
    if (!this.storageMap_.has(projectId)) {
      this.storageMap_.set(
          projectId,
          LocalStorage.of<Asset>(this.window_, `pa.assets.${projectId}`));
    }
    return this.storageMap_.get(projectId)!;
  }

  /**
   * Finds an ID for the asset that is guaranteed to be unique.
   *
   * @param projectId ID of the project that the asset belongs to.
   * @return Promise that will be returned with the asset ID that is guaranteed to be unique.
   */
  reserveId(projectId: ProjectId): Promise<string> {
    return this
        .getStorage_(projectId)
        .generateId();
  }

  /**
   * Saves the given asset.
   *
   * @param asset The asset to persist in the storage.
   * @return Promise that will be resolved when the update operation is completed.
   */
  update(asset: Asset, projectId: ProjectId): Promise<void> {
    let storage = this.getStorage_(projectId);
    return storage
        .read(asset.getId())
        .then((existingAsset: Asset | null) => {
          return Promise.all([
            existingAsset === null,
            storage.update(asset.getId(), asset),
          ]);
        })
        .then(([isNewAsset]: [boolean, void]) => {
          if (isNewAsset) {
            this.dispatch(CollectionEvents.ADDED, () => undefined, asset);
          }
        });
  }
}

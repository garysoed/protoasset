import { BaseListenable } from 'external/gs_tools/src/event';
import { bind, inject } from 'external/gs_tools/src/inject';
import { CachedStorage, LocalStorage } from 'external/gs_tools/src/store';

import { Asset, AssetSearchIndex } from './asset';
import { CollectionEvents } from './collection-events';
import { CollectionStorage } from './collection-storage';


type ProjectId = string;

/**
 * Provides collection of assets.
 */
@bind('pa.data.AssetCollection')
export class AssetCollection extends BaseListenable<CollectionEvents> {
  private readonly storageMap_: Map<ProjectId, CollectionStorage<Asset, AssetSearchIndex>>;
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
  private getStorage_(projectId: ProjectId): CollectionStorage<Asset, AssetSearchIndex> {
    if (!this.storageMap_.has(projectId)) {
      const cachedStorage =
          CachedStorage.of(LocalStorage.of<Asset>(this.window_, `pa.assets.${projectId}`));
      this.addDisposable(cachedStorage);
      this.storageMap_.set(
          projectId,
          CollectionStorage.of(AssetCollection.getSearchIndex_, cachedStorage));
    }
    return this.storageMap_.get(projectId)!;
  }

  /**
   * Gets the asset from the storage.
   *
   * @param projectId ID of the project that the asset belongs to.
   * @param assetId ID of the asset.
   * @return Promise that will be resolved with the asset, or null if the asset cannot be found.
   */
  get(projectId: ProjectId, assetId: string): Promise<Asset | null> {
    return this.getStorage_(projectId).get(assetId);
  }

  /**
   * @param projectId ID of the project whose assets should be returned.
   * @return Promise that will be resolved with the assets belonging to the given project.
   */
  list(projectId: ProjectId): Promise<Asset[]> {
    return this.getStorage_(projectId).list();
  }

  /**
   * @param projectId ID of the project whose assets should be searched in.
   * @param token Search query for the asset.
   * @return Promise that will be resolved with assets in the given project that matches the given
   *     search query.
   */
  search(projectId: ProjectId, token: string): Promise<Asset[]> {
    return this.getStorage_(projectId).search(token);
  }

  /**
   * Finds an ID for the asset that is guaranteed to be unique.
   *
   * @param projectId ID of the project that the asset belongs to.
   * @return Promise that will be returned with the asset ID that is guaranteed to be unique.
   */
  reserveId(projectId: ProjectId): Promise<string> {
    return this.getStorage_(projectId).reserveId();
  }

  /**
   * Saves the given asset.
   *
   * @param asset The asset to persist in the storage.
   * @return Promise that will be resolved when the update operation is completed.
   */
  async update(asset: Asset): Promise<void> {
    const isNewProject = await this.getStorage_(asset.getProjectId()).update(asset.getId(), asset);
    if (isNewProject) {
      this.dispatch(CollectionEvents.ADDED, () => undefined, asset);
    }
  }

  /**
   * @param asset Asset whose search index should be returned.
   * @return The search index of the given asset.
   */
  private static getSearchIndex_(asset: Asset): AssetSearchIndex {
    return asset.getSearchIndex();
  }
}

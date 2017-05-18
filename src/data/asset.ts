import { Field, Serializable } from 'external/gs_tools/src/data';
import { BaseListenable } from 'external/gs_tools/src/event';
import { ImmutableList, ImmutableMap, Iterables } from 'external/gs_tools/src/immutable';

import { BaseLayer } from '../data/base-layer';
import { DataEvents } from '../data/data-events';
import { Helper } from '../data/helper';
import { IDataSource } from '../data/i-data-source';


/**
 * Types of asset. DO NOT REORDER.
 */
export enum AssetType {
  UNKNOWN,
  CARD,
}

export type AssetSearchIndex = {
  name: string,
  this: Asset,
};

@Serializable('asset')
export class Asset extends BaseListenable<DataEvents> {
  @Field('data') private data_: IDataSource<string[][]> | null;
  @Field('filename') private filename_: string;
  @Field('height') private height_: number;
  @Field('helpers') private helpers_: {[id: string]: Helper};
  @Field('id') private id_: string;
  @Field('layers') private layers_: BaseLayer[];
  @Field('name') private name_: string;
  @Field('projectId') private projectId_: string;
  @Field('type') private type_: AssetType;
  @Field('width') private width_: number;

  constructor(id: string, projectId: string) {
    super();
    this.filename_ = 'unnamed_asset.png';
    this.height_ = NaN;
    this.id_ = id;
    this.name_ = 'Unnamed Asset';
    this.projectId_ = projectId;
    this.type_ = AssetType.UNKNOWN;
    this.width_ = NaN;
    this.data_ = null;
    this.helpers_ = {};
    this.layers_ = [];
  }

  /**
   * Deletes the given helper.
   */
  deleteHelper(helperId: string): void {
    if (!this.helpers_[helperId]) {
      return;
    }

    this.dispatch(DataEvents.CHANGED, () => {
      delete this.helpers_[helperId];
    });
  }

  disposeInternal(): void {
    this.layers_
        .forEach((layer: BaseLayer) => {
          layer.dispose();
        });
    for (const [key, helper] of ImmutableMap.of(this.helpers_)) {
      helper.dispose();
    }
    super.disposeInternal();
  }

  /**
   * @return All helpers added to this asset..
   */
  getAllHelpers(): Helper[] {
    return Iterables.toArray(ImmutableMap.of(this.helpers_).values());
  }

  /**
   * @return The data source for the asset.
   */
  getData(): IDataSource<string[][]> | null {
    return this.data_;
  }

  /**
   * @return The filename of the assets generated.
   */
  getFilename(): string {
    return this.filename_;
  }

  /**
   * @return The height of the asset, in pixels.
   */
  getHeight(): number {
    return this.height_;
  }

  /**
   * @param helperId ID of the helper to return.
   * @return The helper corresponding to the given ID or null if it doesn't exist.
   */
  getHelper(helperId: string): Helper | null {
    return this.helpers_[helperId] || null;
  }

  /**
   * @return ID of the asset.
   */
  getId(): string {
    return this.id_;
  }

  /**
   * @return IDs of the layers in the asset.
   */
  getLayerIds(): string[] {
    return ImmutableList
        .of(this.layers_)
        .map((layer: BaseLayer) => {
          return layer.getId();
        })
        .toArray();
  }

  /**
   * @return The layers in the asset.
   */
  getLayers(): BaseLayer[] {
    return this.layers_;
  }

  /**
   * @return Name of the asset.
   */
  getName(): string {
    return this.name_;
  }

  /**
   * @return ID of the project that this asset was a part of.
   */
  getProjectId(): string {
    return this.projectId_;
  }

  /**
   * @return Index for searching this asset.
   */
  getSearchIndex(): AssetSearchIndex {
    return {
      name: this.name_,
      this: this,
    };
  }

  /**
   * @return The type of the asset.
   */
  getType(): AssetType {
    return this.type_;
  }

  /**
   * @return The width of the asset, in pixels.
   */
  getWidth(): number {
    return this.width_;
  }

  /**
   * Inserts a layer at the specified index. If the layer already exists, move to the specified
   * index.
   * @param layer The layer to insert.
   * @param index The index to insert / move the layer to.
   */
  insertLayer(layer: BaseLayer, index: number = 0): void {
    const removeIndex = this.layers_.indexOf(layer);
    if (removeIndex === index) {
      return;
    }

    this.dispatch(DataEvents.CHANGED, () => {
      if (removeIndex >= 0) {
        this.layers_.splice(removeIndex, 1);
      }
      this.layers_.splice(index, 0, layer);
    });
  }

  /**
   * Removes the layer.
   * @param layer The layer to remove.
   */
  removeLayer(layer: BaseLayer): void {
    const index = this.layers_.indexOf(layer);
    if (index < 0) {
      return;
    }

    this.dispatch(DataEvents.CHANGED, () => {
      const [deletedLayer] = this.layers_.splice(index, 1);
      deletedLayer.dispose();
    });
  }

  /**
   * @param data The data to set.
   */
  setData(data: IDataSource<string[][]>): void {
    if (this.data_ === data) {
      return;
    }

    this.dispatch(DataEvents.CHANGED, () => {
      this.data_ = data;
    });
  }

  /**
   * @param filename The filename of the assets generated.
   */
  setFilename(filename: string): void {
    if (this.filename_ === filename) {
      return;
    }

    this.dispatch(DataEvents.CHANGED, () => {
      this.filename_ = filename;
    });
  }

  /**
   * @param height The height of the asset, in pixels.
   */
  setHeight(height: number): void {
    if (this.height_ === height) {
      return;
    }

    this.dispatch(DataEvents.CHANGED, () => {
      this.height_ = height;
    });
  }

  /**
   * @param helpers Map of helper IDs to the associated helper.
   */
  setHelper(id: string, helper: Helper): void {
    if (this.helpers_[id] === helper) {
      return;
    }

    this.dispatch(DataEvents.CHANGED, () => {
      this.helpers_[id] = helper;
    });
  }

  /**
   * @param layers Layers to set to the asset.
   */
  setLayers(layers: BaseLayer[]): void {
    if (ImmutableList.of(this.layers_).equals(ImmutableList.of(layers))) {
      return;
    }

    this.dispatch(DataEvents.CHANGED, () => {
      this.layers_ = layers;
    });
  }

  /**
   * Sets the name of the asset.
   *
   * @param name The name of the asset.
   */
  setName(name: string): void {
    if (name === this.name_) {
      return;
    }

    this.dispatch(DataEvents.CHANGED, () => {
      this.name_ = name;
    });
  }

  /**
   * Sets the type of the asset.
   *
   * @param type The type of the asset.
   */
  setType(type: AssetType): void {
    if (type === this.type_) {
      return;
    }

    this.dispatch(DataEvents.CHANGED, () => {
      this.type_ = type;
    });
  }

  /**
   * @param width The width of the asset, in pixels.
   */
  setWidth(width: number): void {
    if (width === this.width_) {
      return;
    }

    this.dispatch(DataEvents.CHANGED, () => {
      this.width_ = width;
    });
  }

  /**
   * Renders the asset type into human readable format.
   * @param type Type to render.
   * @return The human readable format of the asset type.
   */
  static renderType(type: AssetType): string {
    switch (type) {
      case AssetType.CARD:
        return 'Deck of cards';
      default:
        return '';
    }
  }
}
// TODO: Mutable

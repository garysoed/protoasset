import { cache, Serializable } from 'external/gs_tools/src/data';
import { DataModel, field } from 'external/gs_tools/src/datamodel';
import { ImmutableList, ImmutableMap } from 'external/gs_tools/src/immutable';

import { DataSource } from '../data/data-source';
import { Helper } from '../data/helper';
import { Layer } from '../data/layer';


/**
 * Types of asset. DO NOT REORDER.
 */
export enum AssetType {
  UNKNOWN,
  CARD,
}

export type AssetSearchIndex = {
  name: string,
  this: Asset2,
};

@Serializable('asset')
export abstract class Asset2 implements DataModel<AssetSearchIndex> {
  @field('data') protected readonly data_: DataSource<ImmutableList<ImmutableList<string>>> | null
      = null;
  @field('filename') protected readonly filename_: string = 'unnamed_asset.png';
  @field('height') protected readonly height_: number = NaN;
  @field('helpers') protected readonly helpers_: ImmutableMap<string, Helper>
      = ImmutableMap.of<string, Helper>([]);
  @field('id') protected readonly id_: string;
  @field('layers') protected readonly layers_: ImmutableList<Layer> = ImmutableList.of([]);
  @field('name') protected readonly name_: string = 'Unnamed Asset';
  @field('projectId') protected readonly projectId_: string;
  @field('type') protected readonly type_: AssetType = AssetType.UNKNOWN;
  @field('width') protected readonly width_: number = NaN;

  /**
   * @return The data source for the asset.
   */
  abstract getData(): DataSource<string[][]> | null;

  /**
   * @return The filename of the assets generated.
   */
  abstract getFilename(): string;

  /**
   * @return The height of the asset, in pixels.
   */
  abstract getHeight(): number;

  /**
   * @return All helpers added to this asset..
   */
  abstract getHelpers(): ImmutableMap<string, Helper>;

  /**
   * @return ID of the asset.
   */
  abstract getId(): string;

  /**
   * @return IDs of the layers in the asset.
   */
  getLayerIds(): string[] {
    return ImmutableList
        .of(this.layers_)
        .map((layer: Layer) => {
          return layer.getId();
        })
        .toArray();
  }

  /**
   * @return The layers in the asset.
   */
  abstract getLayers(): ImmutableList<Layer>;

  /**
   * @return Name of the asset.
   */
  abstract getName(): string;

  /**
   * @return ID of the project that this asset was a part of.
   */
  abstract getProjectId(): string;

  /**
   * @return Index for searching this asset.
   */
  @cache()
  getSearchIndex(): AssetSearchIndex {
    return {
      name: this.name_,
      this: this,
    };
  }

  /**
   * @return The type of the asset.
   */
  abstract getType(): AssetType;

  /**
   * @return The width of the asset, in pixels.
   */
  abstract getWidth(): number;

  /**
   * @param data The data to set.
   */
  abstract setData(data: DataSource<ImmutableList<ImmutableList<string>>>): Asset2;

  /**
   * @param filename The filename of the assets generated.
   */
  abstract setFilename(filename: string): Asset2;

  /**
   * @param height The height of the asset, in pixels.
   */
  abstract setHeight(height: number): Asset2;

  /**
   * Deletes the given helper.
   */
  abstract setHelpers(helpers: ImmutableMap<string, Helper>): Asset2;

  abstract setLayers(layers: ImmutableList<Layer>): Asset2;

  /**
   * Sets the name of the asset.
   *
   * @param name The name of the asset.
   */
  abstract setName(name: string): Asset2;

  /**
   * Sets the type of the asset.
   *
   * @param type The type of the asset.
   */
  abstract setType(type: AssetType): Asset2;

  /**
   * @param width The width of the asset, in pixels.
   */
  abstract setWidth(width: number): Asset2;

  /**
   * Renders the asset type into human readable format.
   * @param type Type to render.
   * @return The human readable format of the asset type.
   */
  @cache()
  static renderType(type: AssetType): string {
    switch (type) {
      case AssetType.CARD:
        return 'Deck of cards';
      default:
        return '';
    }
  }
}

import { cache, Serializable } from 'external/gs_tools/src/data';
import { DataModel, field } from 'external/gs_tools/src/datamodel';
import { ImmutableList, ImmutableMap } from 'external/gs_tools/src/immutable';

import {
  DataModelParser,
  EnumParser,
  FloatParser,
  ListParser,
  MapParser,
  StringParser} from 'external/gs_tools/src/parse';
import { DataSource } from '../data/data-source';
import { DataSource2 } from '../data/data-source2';
import { Helper } from '../data/helper';
import { Helper2 } from '../data/helper2';
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
  @field('data', DataModelParser())
  protected readonly data_: DataSource2<ImmutableList<ImmutableList<string>>> | null = null;
  @field('filename', StringParser) protected readonly filename_: string = 'unnamed_asset.png';
  @field('height', FloatParser) protected readonly height_: number = NaN;
  @field('helpers', MapParser(StringParser, DataModelParser()))
  protected readonly helpers_: ImmutableMap<string, Helper2> = ImmutableMap.of<string, Helper2>([]);
  @field('id', StringParser) protected readonly id_: string;
  @field('layers', ListParser(DataModelParser()))
  protected readonly layers_: ImmutableList<Layer> = ImmutableList.of([]);
  @field('name', StringParser) protected readonly name_: string = 'Unnamed Asset';
  @field('projectId', StringParser) protected readonly projectId_: string;
  @field('type', EnumParser(AssetType)) protected readonly type_: AssetType = AssetType.UNKNOWN;
  @field('width', FloatParser) protected readonly width_: number = NaN;

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
    const list = ImmutableList
        .of(this.layers_)
        .map((layer: Layer) => {
          return layer.getId();
        });
    return [...list];
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

import {Field, Serializable} from 'external/gs_tools/src/data';

import {IDataSource} from './i-data-source';


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
export class Asset {
  @Field('height') private height_: number;
  @Field('id') private id_: string;
  @Field('name') private name_: string;
  @Field('projectId') private projectId_: string;
  @Field('type') private type_: AssetType;
  @Field('width') private width_: number;
  @Field('data') private data_: IDataSource<string[][]> | null;

  constructor(id: string, projectId: string) {
    this.height_ = NaN;
    this.id_ = id;
    this.name_ = 'Unnamed Asset';
    this.projectId_ = projectId;
    this.type_ = AssetType.UNKNOWN;
    this.width_ = NaN;
    this.data_ = null;
  }

  /**
   * @return The data source for the asset.
   */
  getData(): IDataSource<string[][]> | null {
    return this.data_;
  }

  /**
   * @return The height of the asset, in pixels.
   */
  getHeight(): number {
    return this.height_;
  }

  /**
   * @return ID of the asset.
   */
  getId(): string {
    return this.id_;
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
   * @param data The data to set.
   */
  setData(data: IDataSource<string[][]>): void {
    this.data_ = data;
  }

  /**
   * @param height The height of the asset, in pixels.
   */
  setHeight(height: number): void {
    this.height_ = height;
  }

  /**
   * Sets the name of the asset.
   *
   * @param name The name of the asset.
   */
  setName(name: string): void {
    this.name_ = name;
  }

  /**
   * Sets the type of the asset.
   *
   * @param type The type of the asset.
   */
  setType(type: AssetType): void {
    this.type_ = type;
  }

  /**
   * @param width The width of the asset, in pixels.
   */
  setWidth(width: number): void {
    this.width_ = width;
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

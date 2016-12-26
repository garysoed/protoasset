import {Field, Serializable} from 'external/gs_tools/src/data';


/**
 * Types of asset. DO NOT REORDER.
 */
export enum AssetTypes {
  UNKNOWN,
  CARD
}

@Serializable('asset')
export class Asset {
  @Field('id') private id_: string;
  @Field('name') private name_: string;
  @Field('projectId') private projectId_: string;
  @Field('type') private type_: AssetTypes;

  constructor(id: string, projectId: string) {
    this.id_ = id;
    this.name_ = 'Unnamed Asset';
    this.projectId_ = projectId;
    this.type_ = AssetTypes.UNKNOWN;
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
   * @return The type of the asset.
   */
  getType(): AssetTypes {
    return this.type_;
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
  setType(type: AssetTypes): void {
    this.type_ = type;
  }

  /**
   * Renders the asset type into human readable format.
   * @param type Type to render.
   * @return The human readable format of the asset type.
   */
  static renderType(type: AssetTypes): string {
    switch (type) {
      case AssetTypes.CARD:
        return 'Deck of cards';
      default:
        return '';
    }
  }
}

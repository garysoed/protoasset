type Preset = {
  height: string,
  heightPx: number,
  name: string,
  source: Source,
  width: string,
  widthPx: number,
};

export enum Source {
  CUSTOM,
  GAME_CRAFTER,
}

export enum PresetType {
  CUSTOM,
  GAME_CRAFTER_DECK_POKER,
  GAME_CRAFTER_DECK_SQUARE,
}

export const ASSET_PRESETS: Map<PresetType, Preset> = new Map([
  [
    PresetType.GAME_CRAFTER_DECK_POKER,
    {
      height: '3.5"',
      heightPx: 1125,
      name: 'Poker Deck',
      source: Source.GAME_CRAFTER,
      width: '2.5"',
      widthPx: 825,
    },
  ],
  [
    PresetType.GAME_CRAFTER_DECK_SQUARE,
    {
      height: '3.5"',
      heightPx: 1125,
      name: 'Square Deck',
      source: Source.GAME_CRAFTER,
      width: '3.5"',
      widthPx: 1125,
    },
  ],
]);

export const Render = {
  /**
   * Renders the preset.
   *
   * @param preset The preset to render.
   * @return The rendered preset.
   */
  preset(preset: PresetType): string {
    let presetObj = ASSET_PRESETS.get(preset);

    if (presetObj === undefined) {
      return 'Custom';
    }

    let size = `${presetObj.width} × ${presetObj.height}`;
    return `${Render.source(presetObj.source)}: ${presetObj.name} (${size})`;
  },

  /**
   * Renders the source.
   *
   * @param source The source to render.
   * @return The rendered source.
   */
  source(source: Source): string {
    switch (source) {
      case Source.GAME_CRAFTER:
        return 'Game Crafter';
      default:
        return 'Custom';
    }
  },
};

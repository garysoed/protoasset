import { ImmutableMap } from 'external/gs_tools/src/immutable';
import { FakeRouteFactoryService } from 'external/gs_ui/src/routing';

import { Views } from '../routing/views';

export const TestRouteFactoryService: any = FakeRouteFactoryService.create(ImmutableMap.of([
  ['assetData', Views.ASSET_DATA],
  ['assetList', Views.PROJECT],
  ['assetMain', Views.ASSET_MAIN],
  ['assetSettings', Views.ASSET_SETTINGS],
  ['createAsset', Views.CREATE_ASSET],
  ['helper', Views.HELPER],
  ['layer', Views.LAYER],
  ['projectSettings', Views.PROJECT_SETTINGS],
  ['render', Views.RENDER],
]));

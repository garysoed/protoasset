import {
  HasPropertyType,
  IntersectType,
  StringType } from 'external/gs_tools/src/check';

export type RenderResponse = {
  id: string,
  uri: string,
};

export const RenderResponseType = IntersectType
    .builder<RenderResponse>()
    .addType(HasPropertyType('id', StringType))
    .addType(HasPropertyType('uri', StringType))
    .build();

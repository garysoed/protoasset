import {
  HasPropertyType,
  IntersectType,
  NumberType,
  StringType } from 'external/gs_tools/src/check';

export type RenderRequest = {
  css: string,
  height: number,
  html: string,
  id: string,
  width: number,
};

export const RenderRequestType = IntersectType
    .builder<RenderRequest>()
    .addType(HasPropertyType('css', StringType))
    .addType(HasPropertyType('height', NumberType))
    .addType(HasPropertyType('html', StringType))
    .addType(HasPropertyType('id', StringType))
    .addType(HasPropertyType('width', NumberType))
    .build();
// TODO: Mutable

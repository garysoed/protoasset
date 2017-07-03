import {
  TestAsync,
  TestDispose,
  TestJasmine,
  TestSetup } from 'external/gs_tools/src/testing';
import { Log, LogLevel } from 'external/gs_tools/src/util';
export { assert, Matchers } from 'external/gs_tools/src/jasmine';


const TEST_SETUP = new TestSetup([
  TestAsync,
  TestDispose,
  TestJasmine,
]);

let initialized = false;

export const TestBase = {
  setup(): void {
    if (!initialized) {
      TEST_SETUP.setup();
      Log.setEnabledLevel(LogLevel.OFF);
      initialized = true;
    }
  },
};

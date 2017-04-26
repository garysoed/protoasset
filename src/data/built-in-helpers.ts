import { Cases } from 'external/gs_tools/src/string';


export const BuiltInHelpers = {
  /**
   * Converts the string in the helper block into the specified case.
   * @param caseString Case to convert the string to. Can be 'camel', 'lower', 'pascal', or 'upper'.
   * @param options The Handlebars options object.
   * @return The string converted to the given case.
   */
  case(caseString: string, options: any): string {
    const cases = Cases.of(options.fn(this));
    switch (caseString) {
      case 'camel':
        return cases.toCamelCase();
      case 'lower':
        return cases.toLowerCase();
      case 'pascal':
        return cases.toPascalCase();
      case 'upper':
        return cases.toUpperCase();
    }

    throw new Error(`Unsupported string case: ${caseString}`);
  },

  /**
   * Returns the string in the helper block if the two specified values are equal. Otherwise, return
   * the inverse block.
   * @param value The value to compare.
   * @param expected The other value to compare.
   * @param options Handlebars options object.
   * @return The string in the helper block if the two specified values are equal. Otherwise, the
   *    inverse block.
   */
  ifeq(value: string, expected: string, options: any): string {
    return value === expected ? options.fn(this) : options.inverse(this);
  },
};

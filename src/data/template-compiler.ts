import {Jsons} from 'external/gs_tools/src/collection';


export class TemplateCompiler {
  private readonly assetData_: string[][];
  private readonly handlebars_: typeof Handlebars;

  constructor(assetData: string[][], handlebars: typeof Handlebars) {
    this.assetData_ = assetData;
    this.handlebars_ = handlebars;
  }

  /**
   * Compiles the given template string.
   * @param template The Handlebars template string to compile.
   * @return Function that takes in additional data and returns the template with the data applied.
   */
  compile(template: string): (data?: {[key: string]: any}) => string {
    return (additionalData: {[key: string]: any} = {}) => {
      let data = Jsons.mixin({$$: this.assetData_}, additionalData);
      return this.handlebars_.compile(template)(data);
    };
  }

  /**
   * Create a new instance of the compiler.
   *
   * @param assetData Data in the associated asset.
   * @param handlebars The handlebars instance.
   * @return New instance of the compiler.
   */
  static of(assetData: string[][], handlebars: typeof Handlebars) {
    return new TemplateCompiler(assetData, handlebars);
  }
}

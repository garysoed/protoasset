import { Jsons } from 'external/gs_tools/src/collection';


export class TemplateCompiler {
  private readonly handlebars_: typeof Handlebars;
  private readonly rowData_: string[];

  constructor(rowData: string[], handlebars: typeof Handlebars) {
    this.rowData_ = rowData;
    this.handlebars_ = handlebars;
  }

  /**
   * Compiles the given template string.
   * @param template The Handlebars template string to compile.
   * @return Function that takes in additional data and returns the template with the data applied.
   */
  compile(template: string, additionalData: {[key: string]: any} = {}): string {
    const data = Jsons.mixin({$$: this.rowData_}, additionalData);
    return this.handlebars_.compile(template)(data);
  }

  /**
   * Create a new instance of the compiler.
   *
   * @param assetData Data in the associated asset.
   * @param handlebars The handlebars instance.
   * @return New instance of the compiler.
   */
  static of(rowData: string[], handlebars: typeof Handlebars): TemplateCompiler {
    return new TemplateCompiler(rowData, handlebars);
  }
}
// TODO: Mutable

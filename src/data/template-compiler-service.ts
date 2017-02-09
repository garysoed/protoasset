import {Arrays} from 'external/gs_tools/src/collection';
import {bind, inject} from 'external/gs_tools/src/inject';
import {Cases} from 'external/gs_tools/src/string';

import {Asset} from './asset';
import {Helper} from './helper';
import {TemplateCompiler} from './template-compiler';


/**
 * Creates TemplateCompilers from asset.
 */
@bind('pa.common.TemplateCompilerService')
export class TemplateCompilerService {
  private readonly handlebars_: typeof Handlebars;
  private dataRow_: number;

  constructor(@inject('x.Handlebars') handlebars: typeof Handlebars) {
    this.dataRow_ = 0;
    this.handlebars_ = handlebars;
  }

  /**
   * Creates a new TemplateCompiler from the given asset.
   *
   * @param asset Asset to create a new TemplateCompiler from.
   * @return Promise that will be resolved with the newly created TemplateCompiler, or null if it
   *    cannot be created.
   */
  create(asset: Asset, data: string[]): TemplateCompiler {
    let handlebars = this.handlebars_.create();
    Arrays
        .of(asset.getAllHelpers())
        .forEach((helper: Helper) => {
          handlebars.registerHelper(helper.getName(), helper.asFunction());
        });
    handlebars.registerHelper('toLowerCase', function(options: any): string {
      return Cases.of(options.fn(this)).toLowerCase();
    });
    return TemplateCompiler.of(data, handlebars);
  }
}

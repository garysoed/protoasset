import { bind, inject } from 'external/gs_tools/src/inject';
import { deprecated } from 'external/gs_tools/src/typescript';
import { Log } from 'external/gs_tools/src/util';

import { Asset2 } from '../data/asset2';
import { Asset } from './asset';
import { BuiltInHelpers } from './built-in-helpers';
import { TemplateCompiler } from './template-compiler';

const LOGGER = Log.of('pa.data.TemplateCompilerService');

/**
 * Creates TemplateCompilers from asset.
 */
@bind('pa.data.TemplateCompilerService')
export class TemplateCompilerService {
  private dataRow_: number;
  private readonly handlebars_: typeof Handlebars;

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
  @deprecated(LOGGER, 'create has been deprecated. Use create2 instead')
  create(asset: Asset, data: string[]): TemplateCompiler {
    const handlebars = this.handlebars_.create();
    for (const helper of asset.getAllHelpers()) {
      handlebars.registerHelper(helper.getName(), helper.asFunction());
    }
    handlebars.registerHelper('case', BuiltInHelpers.case);
    handlebars.registerHelper('ifeq', BuiltInHelpers.ifeq);
    return TemplateCompiler.of(data, handlebars);
  }

  create2(asset: Asset2, data: string[]): TemplateCompiler {
    const handlebars = this.handlebars_.create();
    for (const [, helper] of asset.getHelpers()) {
      handlebars.registerHelper(helper.getName(), helper.asFunction());
    }
    handlebars.registerHelper('case', BuiltInHelpers.case);
    handlebars.registerHelper('ifeq', BuiltInHelpers.ifeq);
    return TemplateCompiler.of(data, handlebars);
  }
}

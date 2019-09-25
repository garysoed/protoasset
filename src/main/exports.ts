import { Jsons } from 'external/gs_tools/src/data';
import { Injector } from 'external/gs_tools/src/inject';
import { Log, LogLevel } from 'external/gs_tools/src/util';
import { Templates } from 'external/gs_tools/src/webc';

import { Main } from 'external/gs_ui/src/bootstrap';
import { DefaultPalettes, Theme } from 'external/gs_ui/src/theming';

import { CreateProjectView } from '../landing/create-project-view';
import { LandingView } from '../landing/landing-view';
import { ProjectView } from '../project/project-view';
import { RouteFactoryService } from '../routing/route-factory-service';

Log.setEnabledLevel(LogLevel.DEBUG);

function bootstrap(document: Document): void {
  Injector.bindProvider(() => Handlebars, 'x.Handlebars');
  Injector.bindProvider(() => JSZip, 'x.JsZip');
  const main = Main.newInstance({
    ace: window['ace'],
    routeFactoryServiceCtor: RouteFactoryService,
  });

  const theme = Theme.newInstance(
      DefaultPalettes.get('electricviolet'),
      DefaultPalettes.get('cerulean'));
  main.bootstrap(theme, [CreateProjectView, LandingView, ProjectView]);
  main.applyTheme(document);
}

Jsons.setValue(window, 'gs.Templates', Templates);
Jsons.setValue(window, 'pa.bootstrap', bootstrap);
Jsons.setValue(window, 'AceAjax.Editor', {});

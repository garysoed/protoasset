import {Jsons} from 'external/gs_tools/src/collection';
import {Templates} from 'external/gs_tools/src/webc';

import {DefaultPalettes, Main} from 'external/gs_ui/src/bootstrap';
import {Theme} from 'external/gs_ui/src/theming';

import {CreateProjectView} from '../landing/create-project-view';
import {LandingView} from '../landing/landing-view';
import {ProjectView} from '../project/project-view';
import {RouteFactoryService} from '../routing/route-factory-service';


function bootstrap(document: Document): void {
  let main = Main.newInstance({
    ace: window['ace'],
    routeFactoryServiceCtor: RouteFactoryService
  });
  let theme = Theme.newInstance(
      DefaultPalettes.purpleheart,
      DefaultPalettes.orange);
  main.bootstrap(theme, [CreateProjectView, LandingView, ProjectView]);
  main.applyTheme(document);
};

Jsons.setValue(window, 'gs.Templates', Templates);
Jsons.setValue(window, 'pa.bootstrap', bootstrap);

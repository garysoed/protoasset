import {Jsons} from 'external/gs_tools/src/collection';

import {DefaultPalettes, Main} from 'external/gs_ui/src/bootstrap';
import {Templates} from 'external/gs_tools/src/webc';
import {Theme} from 'external/gs_ui/src/theming';

import {CreateProjectView} from '../landing/create-project-view';
import {LandingView} from '../landing/landing-view';
import {ProjectView} from '../project/project-view';


function bootstrap(document: Document): void {
  let main = Main.newInstance();
  let theme = Theme.newInstance(
      DefaultPalettes.egyptianblue,
      DefaultPalettes.orange);
  main.bootstrap(theme, [CreateProjectView, LandingView, ProjectView]);
  main.applyTheme(document);
};

Jsons.setValue(window, 'gs.Templates', Templates);
Jsons.setValue(window, 'pa.bootstrap', bootstrap);

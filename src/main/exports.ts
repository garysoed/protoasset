import {Jsons} from 'external/gs_tools/src/collection';

import {DefaultPalettes, Main} from 'external/gs_ui/src/bootstrap';
import {Templates} from 'external/gs_tools/src/webc';
import {Theme} from 'external/gs_ui/src/theming';

import {CreateProjectView} from '../landing/create-project-view';
import {LandingView} from '../landing/landing-view';


const bootstrap = () => {
  let main = Main.newInstance();
  let theme = Theme.newInstance(
      DefaultPalettes.indigo,
      DefaultPalettes.orange);
  main.bootstrap(theme, [CreateProjectView, LandingView]);
};

Jsons.setValue(window, 'gs.Templates', Templates);
Jsons.setValue(window, 'pa.bootstrap', bootstrap);

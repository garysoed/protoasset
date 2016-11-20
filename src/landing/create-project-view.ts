import {BaseElement, customElement, handle} from 'external/gs_tools/src/webc';
import {inject} from 'external/gs_tools/src/inject';
import {LocationService, LocationServiceEvents} from 'external/gs_tools/src/ui';

import {Project} from '../data/project';
import {ProjectCollection} from '../data/project-collection';


/**
 * The main landing view of the app.
 */
@customElement({
  tag: 'pa-create-project-view',
  templateKey: 'src/landing/create-project-view',
})
export class CreateProjectView extends BaseElement {
  @handle.shadow.event('gs-basic-button', 'click')
  private onCreateClick_(): void {
    debugger;
  }
}

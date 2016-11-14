import {BaseElement, customElement} from 'external/gs_tools/src/webc';
import {inject} from 'external/gs_tools/src/inject';
import {LocationService, LocationServiceEvents} from 'external/gs_tools/src/ui';

import {Project} from '../data/project';
import {ProjectCollection} from '../data/project-collection';


/**
 * The main landing view of the app.
 */
@customElement({
  dependencies: [ProjectCollection],
  tag: 'pa-landing-view',
  templateKey: 'src/landing/landing-view',
})
export class LandingView extends BaseElement {
  private readonly locationService_: LocationService;
  private readonly projectCollection_: ProjectCollection;

  constructor(
      @inject('gs.LocationService') locationService: LocationService,
      @inject('pa.ProjectCollection') projectCollection: ProjectCollection) {
    super();
    this.locationService_ = locationService;
    this.projectCollection_ = projectCollection;
  }

  /**
   * Handles event when the location was changed.
   */
  private onLocationChanged_(): Promise<void> {
    if (this.locationService_.hasMatch('/$')) {
      return this.projectCollection_
          .list()
          .then((projects: Project[]) => {
            if (projects.length === 0) {
              this.locationService_.goTo('/create');
            }
          });
    } else {
      return Promise.resolve();
    }
  }

  /**
   * @override
   */
  onCreated(element: HTMLElement): void {
    super.onCreated(element);
    this.addDisposable(this.locationService_.on(
        LocationServiceEvents.CHANGED,
        this.onLocationChanged_.bind(this)));
    this.onLocationChanged_();
  }
}

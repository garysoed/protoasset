import {
  bind,
  BooleanParser,
  customElement,
  DomBridge,
  handle,
  StringParser} from 'external/gs_tools/src/webc';
import {DomEvent} from 'external/gs_tools/src/event';
import {inject} from 'external/gs_tools/src/inject';

import {BaseThemedElement} from 'external/gs_ui/src/common';
import {Event} from 'external/gs_ui/src/const';
import {ThemeService} from 'external/gs_ui/src/theming';


@customElement({
  tag: 'pa-filter-button',
  templateKey: 'src/common/filter-button',
})
export class FilterButton extends BaseThemedElement {
  @bind('#drawer').attribute('gs-is-expanded', BooleanParser)
  private readonly drawerExpandedBridge_: DomBridge<boolean>;

  @bind(null).attribute('filter-text', StringParser)
  private readonly filterTextAttrBridge_: DomBridge<string>;

  @bind('#searchText').attribute('gs-value', StringParser)
  private readonly searchTextValueBridge_: DomBridge<string>;

  constructor(
      @inject('theming.ThemeService') themeService: ThemeService) {
    super(themeService);
    this.drawerExpandedBridge_ = DomBridge.of<boolean>(true);
    this.filterTextAttrBridge_ = DomBridge.of<string>();
    this.searchTextValueBridge_ = DomBridge.of<string>();
  }

  @handle('#clearButton').event(Event.ACTION)
  protected onClearButtonAction_(): void {
    this.searchTextValueBridge_.set('');
    this.filterTextAttrBridge_.set('');
  }

  @handle('#searchButton').event(Event.ACTION)
  protected onSearchButtonAction_(): void {
    this.drawerExpandedBridge_.set(!this.drawerExpandedBridge_.get());
  }

  @handle('#searchText').event(DomEvent.CHANGE)
  protected onSearchTextChange_(): void {
    this.filterTextAttrBridge_.set(this.searchTextValueBridge_.get() || '');
  }
}

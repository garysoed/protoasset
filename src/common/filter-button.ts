import { DomEvent } from 'external/gs_tools/src/event';
import { inject } from 'external/gs_tools/src/inject';
import { BooleanParser, StringParser } from 'external/gs_tools/src/parse';
import {
  bind,
  customElement,
  DomHook,
  handle } from 'external/gs_tools/src/webc';

import { BaseThemedElement } from 'external/gs_ui/src/common';
import { Event } from 'external/gs_ui/src/const';
import { ThemeService } from 'external/gs_ui/src/theming';


@customElement({
  tag: 'pa-filter-button',
  templateKey: 'src/common/filter-button',
})
export class FilterButton extends BaseThemedElement {
  @bind('#drawer').attribute('gs-is-expanded', BooleanParser)
  private readonly drawerExpandedHook_: DomHook<boolean>;

  @bind(null).attribute('filter-text', StringParser)
  private readonly filterTextAttrHook_: DomHook<string>;

  @bind('#searchText').attribute('gs-value', StringParser)
  private readonly searchTextValueHook_: DomHook<string>;

  constructor(
      @inject('theming.ThemeService') themeService: ThemeService) {
    super(themeService);
    this.drawerExpandedHook_ = DomHook.of<boolean>(true);
    this.filterTextAttrHook_ = DomHook.of<string>();
    this.searchTextValueHook_ = DomHook.of<string>();
  }

  @handle('#clearButton').event(Event.ACTION)
  protected onClearButtonAction_(): void {
    this.searchTextValueHook_.set('');
    this.filterTextAttrHook_.set('');
    this.drawerExpandedHook_.set(false);
  }

  @handle('#searchButton').event(Event.ACTION)
  protected onSearchButtonAction_(): void {
    this.drawerExpandedHook_.set(!this.drawerExpandedHook_.get());
  }

  @handle('#searchText').event(DomEvent.CHANGE)
  protected onSearchTextChange_(): void {
    this.filterTextAttrHook_.set(this.searchTextValueHook_.get() || '');
  }
}

import { Arrays } from 'external/gs_tools/src/collection';
import { DomEvent, ListenableDom } from 'external/gs_tools/src/event';
import { inject } from 'external/gs_tools/src/inject';
import { BooleanParser, IntegerParser, StringParser } from 'external/gs_tools/src/parse';
import {
  ChildElementDataHelper,
  customElement,
  DomHook,
  handle,
  hook } from 'external/gs_tools/src/webc';

import { BaseThemedElement } from 'external/gs_ui/src/common';
import { ThemeService } from 'external/gs_ui/src/theming';

import { SampleDataSearchIndex, SampleDataService } from '../common/sample-data-service';


type SampleItemData = {display: string, row: number};
type SearchResultData = {dataRow: number, dataString: string};


export const RESULTS_DATA_HELPER: ChildElementDataHelper<SampleItemData> = {
  /**
   * @override
   */
  create(document: Document, instance: SampleDataPicker): Element {
    const element = document.createElement('div');
    element.classList.add('result');
    const listenableElement = ListenableDom.of(element);
    instance.listenTo(listenableElement, DomEvent.CLICK, instance.onResultClick_);
    instance.addDisposable(listenableElement);
    return element;
  },

  /**
   * @override
   */
  get(element: HTMLElement): SampleItemData | null {
    const display = element.getAttribute('gs-display');
    const row = IntegerParser.parse(element.getAttribute('gs-row'));
    if (display === null || row === null) {
      return null;
    }

    return {display, row};
  },

  /**
   * @override
   */
  set(data: SampleItemData, element: HTMLElement): void {
    const displayText = data.display;
    element.style.display = displayText === '' ? 'none' : '';
    element.innerText = displayText;
    element.setAttribute('gs-row', IntegerParser.stringify(data.row));
    element.setAttribute('gs-display', displayText);
  },
};


/**
 * Picker for sample data
 */
@customElement({
  tag: 'pa-sample-data-picker',
  templateKey: 'src/common/sample-data-picker',
})
export class SampleDataPicker extends BaseThemedElement {
  @hook('#drawer').attribute('gs-is-expanded', BooleanParser)
  readonly drawerExpandedHook_: DomHook<boolean>;

  @hook('#results').childrenElements(RESULTS_DATA_HELPER)
  readonly resultsChildrenHook_: DomHook<SampleItemData[]>;

  @hook('#searchText').attribute('gs-value', StringParser)
  readonly searchTextValueHook_: DomHook<string>;

  private fusePromise_: Promise<Fuse<SampleDataSearchIndex> | null> | null;
  private readonly sampleDataService_: SampleDataService;

  constructor(
      @inject('pa.common.SampleDataService') sampleDataService: SampleDataService,
      @inject('theming.ThemeService') themeService: ThemeService) {
    super(themeService);
    this.drawerExpandedHook_ = DomHook.of<boolean>();
    this.fusePromise_ = null;
    this.resultsChildrenHook_ = DomHook.of<SampleItemData[]>();
    this.sampleDataService_ = sampleDataService;
    this.searchTextValueHook_ = DomHook.of<string>();
  }

  /**
   * @return Promise that will be resolved with the fuse.
   */
  private getFuse_(): Promise<Fuse<SampleDataSearchIndex> | null> {
    if (this.fusePromise_ !== null) {
      return this.fusePromise_;
    }

    const promise = this.sampleDataService_.getFuse();
    this.fusePromise_ = promise;
    return promise;
  }

  /**
   * Handles event when a result item is clicked.
   */
  onResultClick_(event: Event): void {
    const target: HTMLElement = event.target as HTMLElement;
    const dataRow = IntegerParser.parse(target.getAttribute('gs-row'));
    if (dataRow === null) {
      return;
    }

    this.sampleDataService_.setDataRow(dataRow);
    this.searchTextValueHook_.set(target.getAttribute('gs-display') || '');
  }

  @handle('#searchButton').event(DomEvent.CLICK)
  onSearchButtonClick_(): void {
    const shouldExpand = !this.drawerExpandedHook_.get();
    this.drawerExpandedHook_.set(shouldExpand);
    if (shouldExpand) {
      this.fusePromise_ = null;
      this.updateResults_();
    }
  }

  @handle('#searchText').attributeChange('gs-value')
  async updateResults_(): Promise<void> {
    const searchText = this.searchTextValueHook_.get();
    if (searchText === null) {
      return;
    }

    const fuse = await this.getFuse_();
    if (fuse === null) {
      return;
    }

    const results = fuse.search(searchText);
    const sampleItemData = Arrays
        .of(results.slice(0, 5))
        .map((index: SampleDataSearchIndex) => {
          return {
            display: index.item.display,
            row: index.item.row,
          };
        })
        .asArray();
    this.resultsChildrenHook_.set(sampleItemData);
  }
}

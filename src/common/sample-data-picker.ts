import {DomEvent, ListenableDom} from 'external/gs_tools/src/event';
import {inject} from 'external/gs_tools/src/inject';
import {
  bind,
  BooleanParser,
  customElement,
  DomHook,
  handle,
  IntegerParser,
  StringParser} from 'external/gs_tools/src/webc';

import {BaseThemedElement} from 'external/gs_ui/src/common';
import {ThemeService} from 'external/gs_ui/src/theming';

import {SampleDataSearchIndex, SampleDataService} from './sample-data-service';


type SearchResultData = {dataRow: number, dataString: string};


/**
 * Sets data to the result item element.
 * @param data The data to set.
 * @param element The result item element.
 */
export function resultsDataSetter(data: SampleDataSearchIndex, element: HTMLElement): void {
  const displayText = data.item.display;
  element.style.display = displayText === '' ? 'none' : '';
  element.innerText = displayText;
  element.setAttribute('gs-row', IntegerParser.stringify(data.item.row));
  element.setAttribute('gs-display', displayText);
}


export function resultsGenerator(document: Document, instance: SampleDataPicker): Element {
  const element = document.createElement('div');
  element.classList.add('result');
  const listenableElement = ListenableDom.of(element);
  instance.addDisposable(
      listenableElement.on(DomEvent.CLICK, instance.onResultClick_, instance));
  instance.addDisposable(listenableElement);
  return element;
}


/**
 * Picker for sample data
 */
@customElement({
  tag: 'pa-sample-data-picker',
  templateKey: 'src/common/sample-data-picker',
})
export class SampleDataPicker extends BaseThemedElement {
  @bind('#drawer').attribute('gs-is-expanded', BooleanParser)
  readonly drawerExpandedHook_: DomHook<boolean>;

  @bind('#results').childrenElements(resultsGenerator, resultsDataSetter)
  readonly resultsChildrenHook_: DomHook<SampleDataSearchIndex[]>;

  @bind('#searchText').attribute('gs-value', StringParser)
  readonly searchTextValueHook_: DomHook<string>;

  private readonly sampleDataService_: SampleDataService;
  private fusePromise_: Promise<Fuse<SampleDataSearchIndex | null>> | null;

  constructor(
      @inject('pa.common.SampleDataService') sampleDataService: SampleDataService,
      @inject('theming.ThemeService') themeService: ThemeService) {
    super(themeService);
    this.drawerExpandedHook_ = DomHook.of<boolean>();
    this.fusePromise_ = null;
    this.resultsChildrenHook_ = DomHook.of<SampleDataSearchIndex[]>();
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
    const target: HTMLElement = <HTMLElement> event.target;
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
    this.resultsChildrenHook_.set(results.slice(0, 5));
  }
}

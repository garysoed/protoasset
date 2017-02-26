import {bind, inject} from 'external/gs_tools/src/inject';


@bind('pa.common.CssImportService')
export class CssImportService {
  private readonly importedCss_: Set<string>;
  private readonly document_: Document;

  constructor(@inject('x.dom.document') document: Document) {
    this.importedCss_ = new Set<string>();
    this.document_ = document;
  }

  /**
   * Imports the given css url.
   * @param cssUrl The CSS url to import.
   */
  import(cssUrl: string): void {
    if (this.importedCss_.has(cssUrl)) {
      return;
    }

    let styleEl = this.document_.createElement('style');
    styleEl.innerHTML = `@import url('${cssUrl}');`;
    this.document_.head.appendChild(styleEl);
    this.importedCss_.add(cssUrl);
  }
}

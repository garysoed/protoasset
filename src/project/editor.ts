import { inject } from 'external/gs_tools/src/inject';
import { StringParser } from 'external/gs_tools/src/parse';
import { customElement, DomHook, handle, hook } from 'external/gs_tools/src/webc';

import { BaseThemedElement } from 'external/gs_ui/src/common';
import { ThemeService } from 'external/gs_ui/src/theming';


/**
 * Project editor
 */
@customElement({
  tag: 'pa-project-editor',
  templateKey: 'src/project/editor',
})
export class Editor extends BaseThemedElement {
  @hook('#editor').attribute('gs-value', StringParser)
  readonly editorValueHook_: DomHook<string>;

  @hook(null).attribute('project-name', StringParser)
  readonly projectNameHook_: DomHook<string>;

  constructor(
      @inject('theming.ThemeService') themeService: ThemeService) {
    super(themeService);
    this.editorValueHook_ = DomHook.of<string>();
    this.projectNameHook_ = DomHook.of<string>();
  }

  @handle('#editor').attributeChange('gs-value')
  onEditorValueChanged_(): void {
    const editorValue = this.editorValueHook_.get();
    if (this.projectNameHook_.get() !== editorValue && editorValue !== null) {
      this.projectNameHook_.set(editorValue);
    }
  }

  @handle(null).attributeChange('project-name')
  onProjectNameChanged_(): void {
    const projectName = this.projectNameHook_.get();
    if (this.editorValueHook_.get() !== projectName && projectName !== null) {
      this.editorValueHook_.set(projectName);
    }
  }
}
// TODO: Mutable

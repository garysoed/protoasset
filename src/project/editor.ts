import { inject } from 'external/gs_tools/src/inject';
import { StringParser } from 'external/gs_tools/src/parse';
import { customElement, dom, domOut, onDom } from 'external/gs_tools/src/webc';

import { ImmutableList } from 'external/gs_tools/src/immutable';
import { MonadSetter } from 'external/gs_tools/src/interfaces';
import { BaseThemedElement2 } from 'external/gs_ui/src/common';
import { ThemeService } from 'external/gs_ui/src/theming';

const PROJECT_NAME_EDITOR_EL = '#editor';
const PROJECT_NAME_EDITOR_ATTR = {
  name: 'value',
  parser: StringParser,
  selector: PROJECT_NAME_EDITOR_EL,
};

const PROJECT_NAME_ATTR = {name: 'project-name', parser: StringParser, selector: null};

/**
 * Project editor
 */
@customElement({
  tag: 'pa-project-editor',
  templateKey: 'src/project/editor',
})
export class Editor extends BaseThemedElement2 {
  constructor(
      @inject('theming.ThemeService') themeService: ThemeService) {
    super(themeService);
  }

  @onDom.attributeChange(PROJECT_NAME_EDITOR_ATTR)
  onEditorValueChanged_(
      @dom.attribute(PROJECT_NAME_EDITOR_ATTR) newProjectName: string | null,
      @domOut.attribute(PROJECT_NAME_ATTR) projectNameSetter: MonadSetter<string | null>):
      ImmutableList<MonadSetter<any>> {
    if (projectNameSetter.value !== newProjectName && newProjectName !== null) {
      projectNameSetter.value = newProjectName;
      return ImmutableList.of([projectNameSetter]);
    }
    return ImmutableList.of([]);
  }

  @onDom.attributeChange(PROJECT_NAME_ATTR)
  onProjectNameChanged_(
      @dom.attribute(PROJECT_NAME_ATTR) newProjectName: string | null,
      @domOut.attribute(PROJECT_NAME_EDITOR_ATTR) projectNameSetter: MonadSetter<string | null>):
      ImmutableList<MonadSetter<any>> {
    if (projectNameSetter.value !== newProjectName && newProjectName !== null) {
      projectNameSetter.value = newProjectName;
      return ImmutableList.of([projectNameSetter]);
    }
    return ImmutableList.of([]);
  }
}

import { assert, Matchers, TestBase } from '../test-base';
TestBase.setup();

import { Mocks } from 'external/gs_tools/src/mock';
import { TestDispose } from 'external/gs_tools/src/testing';

import { Editor } from '../project/editor';


describe('project.Editor', () => {
  let editor: Editor;

  beforeEach(() => {
    editor = new Editor(Mocks.object('ThemeService'));
    TestDispose.add(editor);
  });

  describe('onEditorValueChanged_', () => {
    it('should update the project name', () => {
      const editorValue = 'editorValue';
      const projectNameId = 'projectNameId';
      assert(editor.onEditorValueChanged_(editorValue, {id: projectNameId, value: null}))
          .to.haveElements([Matchers.monadSetterWith(editorValue)]);
    });

    it('should not update the project name if they are the same', () => {
      const editorValue = 'editorValue';
      const projectNameId = 'projectNameId';
      assert(editor.onEditorValueChanged_(editorValue, {id: projectNameId, value: editorValue}))
          .to.haveElements([]);
    });

    it('should not update the project name if editor value is null', () => {
      const projectNameId = 'projectNameId';
      assert(editor.onEditorValueChanged_(null, {id: projectNameId, value: 'oldValue'}))
          .to.haveElements([]);
    });
  });

  describe('onProjectNameChanged_', () => {
    it('should update the editor value', () => {
      const projectName = 'projectName';
      const editorId = 'editorId';
      assert(editor.onProjectNameChanged_(projectName, {id: editorId, value: null}))
          .to.haveElements([Matchers.monadSetterWith(projectName)]);
    });

    it('should not update the editor value if they are the same', () => {
      const projectName = 'projectName';
      const editorId = 'editorId';
      assert(editor.onProjectNameChanged_(projectName, {id: editorId, value: projectName}))
          .to.haveElements([]);
    });

    it('should not update the editor value if project name is null', () => {
      const editorId = 'editorId';
      assert(editor.onProjectNameChanged_(null, {id: editorId, value: 'oldValue'}))
          .to.haveElements([]);
    });
  });
});

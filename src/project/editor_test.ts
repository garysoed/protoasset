import { assert, TestBase } from '../test-base';
TestBase.setup();

import { Mocks } from 'external/gs_tools/src/mock';
import { TestDispose } from 'external/gs_tools/src/testing';

import { FakeMonadSetter } from 'external/gs_tools/src/event';
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
      const fakeProjectNameSetter = new FakeMonadSetter<string | null>(null);

      const list = editor.onEditorValueChanged_(editorValue, fakeProjectNameSetter);
      assert(fakeProjectNameSetter.findValue(list)!.value).to.equal(editorValue);
    });

    it('should not update the project name if they are the same', () => {
      const editorValue = 'editorValue';
      const fakeProjectNameSetter = new FakeMonadSetter<string | null>(editorValue);

      const list = editor.onEditorValueChanged_(editorValue, fakeProjectNameSetter);
      assert([...list]).to.equal([]);
    });

    it('should not update the project name if editor value is null', () => {
      const fakeProjectNameSetter = new FakeMonadSetter<string | null>('oldValue');

      const list = editor.onEditorValueChanged_(null, fakeProjectNameSetter);
      assert([...list]).to.equal([]);
    });
  });

  describe('onProjectNameChanged_', () => {
    it('should update the editor value', () => {
      const projectName = 'projectName';
      const fakeProjectNameSetter = new FakeMonadSetter<string | null>(null);

      const list = editor.onProjectNameChanged_(projectName, fakeProjectNameSetter);
      assert(fakeProjectNameSetter.findValue(list)!.value).to.equal(projectName);
    });

    it('should not update the editor value if they are the same', () => {
      const projectName = 'projectName';
      const fakeProjectNameSetter = new FakeMonadSetter<string | null>(projectName);

      const list = editor.onProjectNameChanged_(projectName, fakeProjectNameSetter);
      assert([...list]).to.equal([]);
    });

    it('should not update the editor value if project name is null', () => {
      const fakeProjectNameSetter = new FakeMonadSetter<string | null>('oldValue');

      const list = editor.onProjectNameChanged_(null, fakeProjectNameSetter);
      assert([...list]).to.equal([]);
    });
  });
});

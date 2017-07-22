import { assert, TestBase } from '../test-base';
TestBase.setup();

import { DataModels, FakeDataAccess } from 'external/gs_tools/src/datamodel';
import { ImmutableMap } from 'external/gs_tools/src/immutable';
import { Mocks } from 'external/gs_tools/src/mock';

import { Project } from '../data/project';
import { ProjectManager } from '../data/project-manager';
import { ProjectSettingsRouteFactory } from '../routing/project-settings-route-factory';


describe('routing.ProjectSettingsRouteFactory', () => {
  let factory: ProjectSettingsRouteFactory;

  beforeEach(() => {
    factory = new ProjectSettingsRouteFactory(Mocks.object('Parent'));
  });

  describe('getName', () => {
    it('should resolve with the correct name', async () => {
      const projectId = 'projectId';
      const projectName = 'projectName';
      const project = DataModels.newInstance<Project>(Project).setName(projectName);

      const projectDataAccess = new FakeDataAccess(
        ImmutableMap.of([[projectId, project]]),
      );
      const mockProjectManagerMonad = jasmine.createSpyObj('ProjectManagerMonad', ['get']);
      mockProjectManagerMonad.get.and.returnValue(projectDataAccess);
      spyOn(ProjectManager, 'monad').and.returnValue(() => mockProjectManagerMonad);
      assert(await factory.getName({projectId})).to.equal(`Settings for ${projectName}`);
    });

    it('should resolve with the correct name if project cannot be found', async () => {
      const projectDataAccess = new FakeDataAccess();
      const mockProjectManagerMonad = jasmine.createSpyObj('ProjectManagerMonad', ['get']);
      mockProjectManagerMonad.get.and.returnValue(projectDataAccess);
      spyOn(ProjectManager, 'monad').and.returnValue(() => mockProjectManagerMonad);
      assert(await factory.getName({projectId: 'projectId'})).to.equal(`Settings`);
    });
  });
});

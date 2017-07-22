import { assert, TestBase } from '../test-base';
TestBase.setup();

import { DataModels, FakeDataAccess } from 'external/gs_tools/src/datamodel';
import { ImmutableMap } from 'external/gs_tools/src/immutable';
import { Mocks } from 'external/gs_tools/src/mock';

import { Project } from '../data/project';
import { ProjectManager } from '../data/project-manager';
import { AssetListRouteFactory } from '../routing/asset-list-route-factory';


describe('routing.AssetListRouteFactory', () => {
  let factory: AssetListRouteFactory;

  beforeEach(() => {
    factory = new AssetListRouteFactory(Mocks.object('parent'));
  });

  describe('getRelativePath_', () => {
    it('should return the correct path', () => {
      const projectId = 'projectId';
      assert(factory['getRelativePath_']({projectId: projectId})).to
          .equal(`/project/${projectId}`);
    });
  });

  describe('getRelativeMatchParams_', () => {
    it('should return the correct params', () => {
      const projectId = 'projectId';
      assert(factory['getRelativeMatchParams_'](ImmutableMap.of([['projectId', projectId]])))
          .to.equal({projectId: projectId});
    });

    it('should throw error if projectId is not found', () => {
      assert(() => {
        factory['getRelativeMatchParams_'](ImmutableMap.of([[]]));
      }).to.throwError(/for project Id/);
    });
  });

  describe('getName', () => {
    it('should return the correct name', async () => {
      const name = 'name';
      const project = DataModels.newInstance<Project>(Project).setName(name);

      const projectId = 'projectId';
      const projectDataAccess = new FakeDataAccess(
        ImmutableMap.of([[projectId, project]]),
      );
      const mockProjectManagerMonad = jasmine.createSpyObj('ProjectManagerMonad', ['get']);
      mockProjectManagerMonad.get.and.returnValue(projectDataAccess);
      spyOn(ProjectManager, 'monad').and.returnValue(() => mockProjectManagerMonad);

      const actualName = await factory.getName({projectId: projectId});
      assert(actualName).to.equal(name);
    });

    it('should return the project ID if the project is unknown', async () => {
      const projectDataAccess = new FakeDataAccess();
      const mockProjectManagerMonad = jasmine.createSpyObj('ProjectManagerMonad', ['get']);
      mockProjectManagerMonad.get.and.returnValue(projectDataAccess);
      spyOn(ProjectManager, 'monad').and.returnValue(() => mockProjectManagerMonad);

      const projectId = 'projectId';
      const actualName = await factory.getName({projectId: projectId});
      assert(actualName).to.equal(`Unknown project ${projectId}`);
    });
  });
});

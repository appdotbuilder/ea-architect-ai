
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  createUserInputSchema,
  updateUserInputSchema,
  createOrganizationInputSchema,
  updateOrganizationInputSchema,
  createProjectInputSchema,
  updateProjectInputSchema,
  createComponentInputSchema,
  updateComponentInputSchema,
  createComponentRelationshipInputSchema,
  createArtifactInputSchema,
  createProjectMemberInputSchema
} from './schema';

// Import handlers
import { createUser } from './handlers/create_user';
import { getUsers } from './handlers/get_users';
import { updateUser } from './handlers/update_user';
import { deleteUser } from './handlers/delete_user';
import { createOrganization } from './handlers/create_organization';
import { getOrganizations } from './handlers/get_organizations';
import { updateOrganization } from './handlers/update_organization';
import { deleteOrganization } from './handlers/delete_organization';
import { createProject } from './handlers/create_project';
import { getProjects } from './handlers/get_projects';
import { getProjectsByOrganization } from './handlers/get_projects_by_organization';
import { getProjectsByUser } from './handlers/get_projects_by_user';
import { updateProject } from './handlers/update_project';
import { deleteProject } from './handlers/delete_project';
import { createComponent } from './handlers/create_component';
import { getComponents } from './handlers/get_components';
import { getComponentsByProject } from './handlers/get_components_by_project';
import { getComponentsByLayer } from './handlers/get_components_by_layer';
import { updateComponent } from './handlers/update_component';
import { deleteComponent } from './handlers/delete_component';
import { createComponentRelationship } from './handlers/create_component_relationship';
import { getComponentRelationships } from './handlers/get_component_relationships';
import { getRelationshipsByComponent } from './handlers/get_relationships_by_component';
import { getRelationshipsByProject } from './handlers/get_relationships_by_project';
import { deleteComponentRelationship } from './handlers/delete_component_relationship';
import { createArtifact } from './handlers/create_artifact';
import { getArtifacts } from './handlers/get_artifacts';
import { getArtifactsByProject } from './handlers/get_artifacts_by_project';
import { getArtifactsByComponent } from './handlers/get_artifacts_by_component';
import { deleteArtifact } from './handlers/delete_artifact';
import { createProjectMember } from './handlers/create_project_member';
import { getProjectMembers } from './handlers/get_project_members';
import { updateProjectMemberRole } from './handlers/update_project_member_role';
import { removeProjectMember } from './handlers/remove_project_member';
import { getProjectDashboard } from './handlers/get_project_dashboard';
import { getComponentReport } from './handlers/get_component_report';
import { getRelationshipReport } from './handlers/get_relationship_report';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // User management
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),
  getUsers: publicProcedure
    .query(() => getUsers()),
  updateUser: publicProcedure
    .input(updateUserInputSchema)
    .mutation(({ input }) => updateUser(input)),
  deleteUser: publicProcedure
    .input(z.number())
    .mutation(({ input }) => deleteUser(input)),

  // Organization management
  createOrganization: publicProcedure
    .input(createOrganizationInputSchema)
    .mutation(({ input }) => createOrganization(input)),
  getOrganizations: publicProcedure
    .query(() => getOrganizations()),
  updateOrganization: publicProcedure
    .input(updateOrganizationInputSchema)
    .mutation(({ input }) => updateOrganization(input)),
  deleteOrganization: publicProcedure
    .input(z.number())
    .mutation(({ input }) => deleteOrganization(input)),

  // Project management
  createProject: publicProcedure
    .input(createProjectInputSchema)
    .mutation(({ input }) => createProject(input)),
  getProjects: publicProcedure
    .query(() => getProjects()),
  getProjectsByOrganization: publicProcedure
    .input(z.number())
    .query(({ input }) => getProjectsByOrganization(input)),
  getProjectsByUser: publicProcedure
    .input(z.number())
    .query(({ input }) => getProjectsByUser(input)),
  updateProject: publicProcedure
    .input(updateProjectInputSchema)
    .mutation(({ input }) => updateProject(input)),
  deleteProject: publicProcedure
    .input(z.number())
    .mutation(({ input }) => deleteProject(input)),

  // Component management
  createComponent: publicProcedure
    .input(createComponentInputSchema)
    .mutation(({ input }) => createComponent(input)),
  getComponents: publicProcedure
    .query(() => getComponents()),
  getComponentsByProject: publicProcedure
    .input(z.number())
    .query(({ input }) => getComponentsByProject(input)),
  getComponentsByLayer: publicProcedure
    .input(z.object({
      projectId: z.number(),
      layer: z.enum(['business', 'data', 'application', 'technology'])
    }))
    .query(({ input }) => getComponentsByLayer(input.projectId, input.layer)),
  updateComponent: publicProcedure
    .input(updateComponentInputSchema)
    .mutation(({ input }) => updateComponent(input)),
  deleteComponent: publicProcedure
    .input(z.number())
    .mutation(({ input }) => deleteComponent(input)),

  // Component relationship management
  createComponentRelationship: publicProcedure
    .input(createComponentRelationshipInputSchema)
    .mutation(({ input }) => createComponentRelationship(input)),
  getComponentRelationships: publicProcedure
    .query(() => getComponentRelationships()),
  getRelationshipsByComponent: publicProcedure
    .input(z.number())
    .query(({ input }) => getRelationshipsByComponent(input)),
  getRelationshipsByProject: publicProcedure
    .input(z.number())
    .query(({ input }) => getRelationshipsByProject(input)),
  deleteComponentRelationship: publicProcedure
    .input(z.number())
    .mutation(({ input }) => deleteComponentRelationship(input)),

  // Artifact management
  createArtifact: publicProcedure
    .input(createArtifactInputSchema)
    .mutation(({ input }) => createArtifact(input)),
  getArtifacts: publicProcedure
    .query(() => getArtifacts()),
  getArtifactsByProject: publicProcedure
    .input(z.number())
    .query(({ input }) => getArtifactsByProject(input)),
  getArtifactsByComponent: publicProcedure
    .input(z.number())
    .query(({ input }) => getArtifactsByComponent(input)),
  deleteArtifact: publicProcedure
    .input(z.number())
    .mutation(({ input }) => deleteArtifact(input)),

  // Project member management
  createProjectMember: publicProcedure
    .input(createProjectMemberInputSchema)
    .mutation(({ input }) => createProjectMember(input)),
  getProjectMembers: publicProcedure
    .input(z.number())
    .query(({ input }) => getProjectMembers(input)),
  updateProjectMemberRole: publicProcedure
    .input(z.object({
      projectId: z.number(),
      userId: z.number(),
      newRole: z.enum(['owner', 'editor', 'viewer'])
    }))
    .mutation(({ input }) => updateProjectMemberRole(input.projectId, input.userId, input.newRole)),
  removeProjectMember: publicProcedure
    .input(z.object({
      projectId: z.number(),
      userId: z.number()
    }))
    .mutation(({ input }) => removeProjectMember(input.projectId, input.userId)),

  // Dashboard and reporting
  getProjectDashboard: publicProcedure
    .input(z.number())
    .query(({ input }) => getProjectDashboard(input)),
  getComponentReport: publicProcedure
    .input(z.number())
    .query(({ input }) => getComponentReport(input)),
  getRelationshipReport: publicProcedure
    .input(z.number())
    .query(({ input }) => getRelationshipReport(input))
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`EA Architect AI TRPC server listening at port: ${port}`);
}

start();


import { db } from '../db';
import { organizationsTable, usersTable, projectsTable, componentsTable, componentRelationshipsTable, artifactsTable, projectMembersTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function deleteOrganization(id: number): Promise<void> {
  try {
    // First, get all projects in this organization to cascade delete their dependencies
    const projects = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.organization_id, id))
      .execute();

    // For each project, delete all its dependencies in order
    for (const project of projects) {
      // Delete component relationships first (they reference components)
      const components = await db.select()
        .from(componentsTable)
        .where(eq(componentsTable.project_id, project.id))
        .execute();

      for (const component of components) {
        // Delete relationships where this component is source or target
        await db.delete(componentRelationshipsTable)
          .where(eq(componentRelationshipsTable.source_component_id, component.id))
          .execute();
        
        await db.delete(componentRelationshipsTable)
          .where(eq(componentRelationshipsTable.target_component_id, component.id))
          .execute();
      }

      // Delete artifacts (they reference components and projects)
      await db.delete(artifactsTable)
        .where(eq(artifactsTable.project_id, project.id))
        .execute();

      // Delete components
      await db.delete(componentsTable)
        .where(eq(componentsTable.project_id, project.id))
        .execute();

      // Delete project members
      await db.delete(projectMembersTable)
        .where(eq(projectMembersTable.project_id, project.id))
        .execute();
    }

    // Delete all projects in the organization
    await db.delete(projectsTable)
      .where(eq(projectsTable.organization_id, id))
      .execute();

    // Delete all users in the organization
    await db.delete(usersTable)
      .where(eq(usersTable.organization_id, id))
      .execute();

    // Finally, delete the organization itself
    await db.delete(organizationsTable)
      .where(eq(organizationsTable.id, id))
      .execute();

  } catch (error) {
    console.error('Organization deletion failed:', error);
    throw error;
  }
}


import { db } from '../db';
import { projectsTable, componentsTable, componentRelationshipsTable, artifactsTable, projectMembersTable } from '../db/schema';
import { eq, inArray } from 'drizzle-orm';

export async function deleteProject(id: number): Promise<void> {
  try {
    // First, get all component IDs for this project
    const projectComponents = await db.select({ id: componentsTable.id })
      .from(componentsTable)
      .where(eq(componentsTable.project_id, id))
      .execute();

    const componentIds = projectComponents.map(c => c.id);

    // Delete in order to respect foreign key constraints
    if (componentIds.length > 0) {
      // 1. Delete component relationships that reference these components
      await db.delete(componentRelationshipsTable)
        .where(inArray(componentRelationshipsTable.source_component_id, componentIds))
        .execute();

      await db.delete(componentRelationshipsTable)
        .where(inArray(componentRelationshipsTable.target_component_id, componentIds))
        .execute();
    }

    // 2. Delete artifacts (references components and project)
    await db.delete(artifactsTable)
      .where(eq(artifactsTable.project_id, id))
      .execute();

    // 3. Delete project members (references project)
    await db.delete(projectMembersTable)
      .where(eq(projectMembersTable.project_id, id))
      .execute();

    // 4. Delete components (references project)
    await db.delete(componentsTable)
      .where(eq(componentsTable.project_id, id))
      .execute();

    // 5. Finally delete the project itself
    await db.delete(projectsTable)
      .where(eq(projectsTable.id, id))
      .execute();
  } catch (error) {
    console.error('Project deletion failed:', error);
    throw error;
  }
}

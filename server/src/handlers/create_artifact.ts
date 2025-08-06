
import { db } from '../db';
import { artifactsTable, projectsTable, usersTable, componentsTable } from '../db/schema';
import { type CreateArtifactInput, type Artifact } from '../schema';
import { eq } from 'drizzle-orm';

export const createArtifact = async (input: CreateArtifactInput): Promise<Artifact> => {
  try {
    // Verify that the project exists
    const project = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.id, input.project_id))
      .execute();

    if (project.length === 0) {
      throw new Error(`Project with id ${input.project_id} not found`);
    }

    // Verify that the user exists
    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.uploaded_by))
      .execute();

    if (user.length === 0) {
      throw new Error(`User with id ${input.uploaded_by} not found`);
    }

    // If component_id is provided, verify that the component exists
    if (input.component_id) {
      const component = await db.select()
        .from(componentsTable)
        .where(eq(componentsTable.id, input.component_id))
        .execute();

      if (component.length === 0) {
        throw new Error(`Component with id ${input.component_id} not found`);
      }
    }

    // Insert artifact record
    const result = await db.insert(artifactsTable)
      .values({
        name: input.name,
        description: input.description || null,
        file_path: input.file_path,
        file_type: input.file_type,
        file_size: input.file_size,
        component_id: input.component_id || null,
        project_id: input.project_id,
        uploaded_by: input.uploaded_by
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Artifact creation failed:', error);
    throw error;
  }
};


import { db } from '../db';
import { projectsTable } from '../db/schema';
import { type UpdateProjectInput, type Project } from '../schema';
import { eq } from 'drizzle-orm';

export const updateProject = async (input: UpdateProjectInput): Promise<Project> => {
  try {
    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    if (input.status !== undefined) {
      updateData.status = input.status;
    }

    // Update project record
    const result = await db.update(projectsTable)
      .set(updateData)
      .where(eq(projectsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Project with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Project update failed:', error);
    throw error;
  }
};

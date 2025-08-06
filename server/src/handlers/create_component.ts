
import { db } from '../db';
import { componentsTable, projectsTable, usersTable } from '../db/schema';
import { type CreateComponentInput, type Component } from '../schema';
import { eq } from 'drizzle-orm';

export const createComponent = async (input: CreateComponentInput): Promise<Component> => {
  try {
    // Validate that project exists
    const project = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.id, input.project_id))
      .execute();

    if (project.length === 0) {
      throw new Error(`Project with id ${input.project_id} does not exist`);
    }

    // Validate that user exists
    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.created_by))
      .execute();

    if (user.length === 0) {
      throw new Error(`User with id ${input.created_by} does not exist`);
    }

    // Insert component record
    const result = await db.insert(componentsTable)
      .values({
        name: input.name,
        description: input.description || null,
        type: input.type,
        layer: input.layer,
        project_id: input.project_id,
        created_by: input.created_by,
        metadata: input.metadata || null
      })
      .returning()
      .execute();

    const component = result[0];
    return component;
  } catch (error) {
    console.error('Component creation failed:', error);
    throw error;
  }
};


import { db } from '../db';
import { componentsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type Component } from '../schema';

export const getComponentsByProject = async (projectId: number): Promise<Component[]> => {
  try {
    const results = await db.select()
      .from(componentsTable)
      .where(eq(componentsTable.project_id, projectId))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to get components by project:', error);
    throw error;
  }
};

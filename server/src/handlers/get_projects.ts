
import { db } from '../db';
import { projectsTable } from '../db/schema';
import { type Project } from '../schema';

export async function getProjects(): Promise<Project[]> {
  try {
    const results = await db.select()
      .from(projectsTable)
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to get projects:', error);
    throw error;
  }
}

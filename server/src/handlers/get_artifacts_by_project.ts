
import { db } from '../db';
import { artifactsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type Artifact } from '../schema';

export const getArtifactsByProject = async (projectId: number): Promise<Artifact[]> => {
  try {
    const results = await db.select()
      .from(artifactsTable)
      .where(eq(artifactsTable.project_id, projectId))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to get artifacts by project:', error);
    throw error;
  }
};

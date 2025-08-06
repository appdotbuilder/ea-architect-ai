
import { db } from '../db';
import { artifactsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type Artifact } from '../schema';

export const getArtifactsByComponent = async (componentId: number): Promise<Artifact[]> => {
  try {
    const results = await db.select()
      .from(artifactsTable)
      .where(eq(artifactsTable.component_id, componentId))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to get artifacts by component:', error);
    throw error;
  }
};

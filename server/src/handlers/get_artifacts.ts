
import { db } from '../db';
import { artifactsTable } from '../db/schema';
import { type Artifact } from '../schema';

export async function getArtifacts(): Promise<Artifact[]> {
  try {
    const results = await db.select()
      .from(artifactsTable)
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch artifacts:', error);
    throw error;
  }
}

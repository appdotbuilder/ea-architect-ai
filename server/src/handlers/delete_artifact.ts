
import { db } from '../db';
import { artifactsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { unlink } from 'node:fs/promises';

export async function deleteArtifact(id: number): Promise<void> {
  try {
    // First, get the artifact to find the file path
    const artifacts = await db.select()
      .from(artifactsTable)
      .where(eq(artifactsTable.id, id))
      .execute();

    if (artifacts.length === 0) {
      throw new Error('Artifact not found');
    }

    const artifact = artifacts[0];

    // Delete the file from filesystem
    try {
      await unlink(artifact.file_path);
    } catch (fileError) {
      // Log file deletion error but continue with database cleanup
      console.warn(`Failed to delete file at ${artifact.file_path}:`, fileError);
    }

    // Delete the artifact record from database
    await db.delete(artifactsTable)
      .where(eq(artifactsTable.id, id))
      .execute();

  } catch (error) {
    console.error('Artifact deletion failed:', error);
    throw error;
  }
}

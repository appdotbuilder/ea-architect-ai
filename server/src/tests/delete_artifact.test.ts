
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { artifactsTable, usersTable, organizationsTable, projectsTable } from '../db/schema';
import { type CreateArtifactInput } from '../schema';
import { deleteArtifact } from '../handlers/delete_artifact';
import { eq } from 'drizzle-orm';
import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';

describe('deleteArtifact', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let testProjectId: number;
  let testArtifactId: number;
  const testFilePath = '/tmp/test-artifact.txt';

  beforeEach(async () => {
    // Create prerequisite organization
    const orgResult = await db.insert(organizationsTable)
      .values({
        name: 'Test Organization',
        description: 'Test org for artifacts'
      })
      .returning()
      .execute();

    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
        organization_id: orgResult[0].id
      })
      .returning()
      .execute();

    testUserId = userResult[0].id;

    // Create prerequisite project
    const projectResult = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        organization_id: orgResult[0].id,
        created_by: testUserId
      })
      .returning()
      .execute();

    testProjectId = projectResult[0].id;

    // Create test file
    await mkdir('/tmp', { recursive: true });
    await writeFile(testFilePath, 'test content');

    // Create test artifact
    const artifactInput: CreateArtifactInput = {
      name: 'Test Artifact',
      description: 'A test artifact',
      file_path: testFilePath,
      file_type: 'text/plain',
      file_size: 12,
      project_id: testProjectId,
      uploaded_by: testUserId
    };

    const artifactResult = await db.insert(artifactsTable)
      .values(artifactInput)
      .returning()
      .execute();

    testArtifactId = artifactResult[0].id;
  });

  it('should delete artifact from database', async () => {
    await deleteArtifact(testArtifactId);

    // Verify artifact is deleted from database
    const artifacts = await db.select()
      .from(artifactsTable)
      .where(eq(artifactsTable.id, testArtifactId))
      .execute();

    expect(artifacts).toHaveLength(0);
  });

  it('should delete associated file from filesystem', async () => {
    // Verify file exists before deletion
    expect(existsSync(testFilePath)).toBe(true);

    await deleteArtifact(testArtifactId);

    // Verify file is deleted from filesystem
    expect(existsSync(testFilePath)).toBe(false);
  });

  it('should throw error for non-existent artifact', async () => {
    const nonExistentId = 99999;

    await expect(deleteArtifact(nonExistentId)).rejects.toThrow(/artifact not found/i);
  });

  it('should delete artifact even if file deletion fails', async () => {
    // Create artifact with non-existent file path
    const artifactWithBadPath = await db.insert(artifactsTable)
      .values({
        name: 'Bad Path Artifact',
        file_path: '/non/existent/path/file.txt',
        file_type: 'text/plain',
        file_size: 100,
        project_id: testProjectId,
        uploaded_by: testUserId
      })
      .returning()
      .execute();

    const badArtifactId = artifactWithBadPath[0].id;

    // Should not throw error even though file doesn't exist
    await deleteArtifact(badArtifactId);

    // Verify artifact is still deleted from database
    const artifacts = await db.select()
      .from(artifactsTable)
      .where(eq(artifactsTable.id, badArtifactId))
      .execute();

    expect(artifacts).toHaveLength(0);
  });
});

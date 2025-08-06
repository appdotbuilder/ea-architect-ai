
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { organizationsTable, usersTable, projectsTable, artifactsTable } from '../db/schema';
import { getArtifactsByProject } from '../handlers/get_artifacts_by_project';

describe('getArtifactsByProject', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return artifacts for a specific project', async () => {
    // Create organization
    const org = await db.insert(organizationsTable)
      .values({
        name: 'Test Org',
        description: 'Test organization'
      })
      .returning()
      .execute();

    // Create user
    const user = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        role: 'member',
        organization_id: org[0].id
      })
      .returning()
      .execute();

    // Create projects
    const project1 = await db.insert(projectsTable)
      .values({
        name: 'Project 1',
        description: 'First project',
        organization_id: org[0].id,
        created_by: user[0].id
      })
      .returning()
      .execute();

    const project2 = await db.insert(projectsTable)
      .values({
        name: 'Project 2',
        description: 'Second project',
        organization_id: org[0].id,
        created_by: user[0].id
      })
      .returning()
      .execute();

    // Create artifacts for both projects
    await db.insert(artifactsTable)
      .values([
        {
          name: 'Artifact 1',
          description: 'First artifact',
          file_path: '/path/to/artifact1.pdf',
          file_type: 'application/pdf',
          file_size: 1024,
          project_id: project1[0].id,
          uploaded_by: user[0].id
        },
        {
          name: 'Artifact 2',
          description: 'Second artifact',
          file_path: '/path/to/artifact2.doc',
          file_type: 'application/msword',
          file_size: 2048,
          project_id: project1[0].id,
          uploaded_by: user[0].id
        },
        {
          name: 'Artifact 3',
          description: 'Third artifact',
          file_path: '/path/to/artifact3.txt',
          file_type: 'text/plain',
          file_size: 512,
          project_id: project2[0].id,
          uploaded_by: user[0].id
        }
      ])
      .execute();

    const result = await getArtifactsByProject(project1[0].id);

    // Should return only artifacts for project 1
    expect(result).toHaveLength(2);
    expect(result[0].name).toEqual('Artifact 1');
    expect(result[0].file_path).toEqual('/path/to/artifact1.pdf');
    expect(result[0].file_type).toEqual('application/pdf');
    expect(result[0].file_size).toEqual(1024);
    expect(result[0].project_id).toEqual(project1[0].id);
    expect(result[0].uploaded_by).toEqual(user[0].id);
    expect(result[0].created_at).toBeInstanceOf(Date);

    expect(result[1].name).toEqual('Artifact 2');
    expect(result[1].project_id).toEqual(project1[0].id);
  });

  it('should return empty array for project with no artifacts', async () => {
    // Create organization
    const org = await db.insert(organizationsTable)
      .values({
        name: 'Test Org',
        description: 'Test organization'
      })
      .returning()
      .execute();

    // Create user
    const user = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        role: 'member',
        organization_id: org[0].id
      })
      .returning()
      .execute();

    // Create project
    const project = await db.insert(projectsTable)
      .values({
        name: 'Empty Project',
        description: 'Project with no artifacts',
        organization_id: org[0].id,
        created_by: user[0].id
      })
      .returning()
      .execute();

    const result = await getArtifactsByProject(project[0].id);

    expect(result).toHaveLength(0);
  });

  it('should return empty array for non-existent project', async () => {
    const result = await getArtifactsByProject(9999);
    expect(result).toHaveLength(0);
  });
});


import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { organizationsTable, usersTable, projectsTable } from '../db/schema';
import { type UpdateProjectInput } from '../schema';
import { updateProject } from '../handlers/update_project';
import { eq } from 'drizzle-orm';

describe('updateProject', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let organizationId: number;
  let userId: number;
  let projectId: number;

  beforeEach(async () => {
    // Create prerequisite organization
    const orgResult = await db.insert(organizationsTable)
      .values({
        name: 'Test Organization',
        description: 'An organization for testing'
      })
      .returning()
      .execute();
    organizationId = orgResult[0].id;

    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
        organization_id: organizationId
      })
      .returning()
      .execute();
    userId = userResult[0].id;

    // Create test project
    const projectResult = await db.insert(projectsTable)
      .values({
        name: 'Original Project',
        description: 'Original description',
        organization_id: organizationId,
        created_by: userId,
        status: 'active'
      })
      .returning()
      .execute();
    projectId = projectResult[0].id;
  });

  it('should update project name', async () => {
    const input: UpdateProjectInput = {
      id: projectId,
      name: 'Updated Project Name'
    };

    const result = await updateProject(input);

    expect(result.id).toEqual(projectId);
    expect(result.name).toEqual('Updated Project Name');
    expect(result.description).toEqual('Original description'); // Unchanged
    expect(result.status).toEqual('active'); // Unchanged
    expect(result.organization_id).toEqual(organizationId);
    expect(result.created_by).toEqual(userId);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update project status', async () => {
    const input: UpdateProjectInput = {
      id: projectId,
      status: 'archived'
    };

    const result = await updateProject(input);

    expect(result.id).toEqual(projectId);
    expect(result.name).toEqual('Original Project'); // Unchanged
    expect(result.description).toEqual('Original description'); // Unchanged
    expect(result.status).toEqual('archived'); // Updated
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update multiple fields', async () => {
    const input: UpdateProjectInput = {
      id: projectId,
      name: 'Multi-Updated Project',
      description: 'Updated description',
      status: 'inactive'
    };

    const result = await updateProject(input);

    expect(result.id).toEqual(projectId);
    expect(result.name).toEqual('Multi-Updated Project');
    expect(result.description).toEqual('Updated description');
    expect(result.status).toEqual('inactive');
    expect(result.organization_id).toEqual(organizationId);
    expect(result.created_by).toEqual(userId);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update description to null', async () => {
    const input: UpdateProjectInput = {
      id: projectId,
      description: null
    };

    const result = await updateProject(input);

    expect(result.id).toEqual(projectId);
    expect(result.name).toEqual('Original Project'); // Unchanged
    expect(result.description).toBeNull(); // Updated to null
    expect(result.status).toEqual('active'); // Unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save changes to database', async () => {
    const input: UpdateProjectInput = {
      id: projectId,
      name: 'Database Updated Project',
      status: 'archived'
    };

    await updateProject(input);

    // Verify changes were persisted
    const projects = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.id, projectId))
      .execute();

    expect(projects).toHaveLength(1);
    expect(projects[0].name).toEqual('Database Updated Project');
    expect(projects[0].status).toEqual('archived');
    expect(projects[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent project', async () => {
    const input: UpdateProjectInput = {
      id: 99999,
      name: 'Non-existent Project'
    };

    expect(updateProject(input)).rejects.toThrow(/project with id 99999 not found/i);
  });

  it('should update timestamp on every update', async () => {
    const originalProject = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.id, projectId))
      .execute();

    const originalTimestamp = originalProject[0].updated_at;

    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const input: UpdateProjectInput = {
      id: projectId,
      name: 'Timestamp Test Project'
    };

    const result = await updateProject(input);

    expect(result.updated_at.getTime()).toBeGreaterThan(originalTimestamp.getTime());
  });
});

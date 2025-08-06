
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { organizationsTable, usersTable, projectsTable } from '../db/schema';
import { getProjects } from '../handlers/get_projects';

describe('getProjects', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no projects exist', async () => {
    const result = await getProjects();
    expect(result).toEqual([]);
  });

  it('should return all projects', async () => {
    // Create prerequisite data
    const org = await db.insert(organizationsTable)
      .values({
        name: 'Test Org',
        description: 'Test organization'
      })
      .returning()
      .execute();

    const user = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
        organization_id: org[0].id
      })
      .returning()
      .execute();

    // Create test projects
    const project1 = await db.insert(projectsTable)
      .values({
        name: 'Project 1',
        description: 'First test project',
        organization_id: org[0].id,
        created_by: user[0].id,
        status: 'active'
      })
      .returning()
      .execute();

    const project2 = await db.insert(projectsTable)
      .values({
        name: 'Project 2',
        description: 'Second test project',
        organization_id: org[0].id,
        created_by: user[0].id,
        status: 'inactive'
      })
      .returning()
      .execute();

    const result = await getProjects();

    expect(result).toHaveLength(2);
    expect(result[0].name).toEqual('Project 1');
    expect(result[0].description).toEqual('First test project');
    expect(result[0].status).toEqual('active');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);

    expect(result[1].name).toEqual('Project 2');
    expect(result[1].description).toEqual('Second test project');
    expect(result[1].status).toEqual('inactive');
    expect(result[1].id).toBeDefined();
    expect(result[1].created_at).toBeInstanceOf(Date);
    expect(result[1].updated_at).toBeInstanceOf(Date);
  });

  it('should return projects with all required fields', async () => {
    // Create prerequisite data
    const org = await db.insert(organizationsTable)
      .values({
        name: 'Test Org',
        description: null
      })
      .returning()
      .execute();

    const user = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        role: 'member',
        organization_id: org[0].id
      })
      .returning()
      .execute();

    // Create project with minimal data
    await db.insert(projectsTable)
      .values({
        name: 'Minimal Project',
        description: null,
        organization_id: org[0].id,
        created_by: user[0].id
      })
      .execute();

    const result = await getProjects();

    expect(result).toHaveLength(1);
    const project = result[0];
    
    // Verify all required fields are present
    expect(typeof project.id).toBe('number');
    expect(typeof project.name).toBe('string');
    expect(project.description).toBeNull();
    expect(typeof project.organization_id).toBe('number');
    expect(typeof project.created_by).toBe('number');
    expect(typeof project.status).toBe('string');
    expect(project.created_at).toBeInstanceOf(Date);
    expect(project.updated_at).toBeInstanceOf(Date);
  });
});

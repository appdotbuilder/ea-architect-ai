
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { projectsTable, projectMembersTable, organizationsTable, usersTable } from '../db/schema';
import { type CreateProjectInput } from '../schema';
import { createProject } from '../handlers/create_project';
import { eq } from 'drizzle-orm';

describe('createProject', () => {
  let testUserId: number;
  let testOrganizationId: number;

  beforeEach(async () => {
    await createDB();

    // Create test organization
    const orgResult = await db.insert(organizationsTable)
      .values({
        name: 'Test Organization',
        description: 'Organization for testing'
      })
      .returning()
      .execute();

    testOrganizationId = orgResult[0].id;

    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
        organization_id: testOrganizationId
      })
      .returning()
      .execute();

    testUserId = userResult[0].id;
  });

  afterEach(resetDB);

  it('should create a project with all required fields', async () => {
    const testInput: CreateProjectInput = {
      name: 'Test Project',
      description: 'A project for testing',
      organization_id: testOrganizationId,
      created_by: testUserId
    };

    const result = await createProject(testInput);

    expect(result.name).toEqual('Test Project');
    expect(result.description).toEqual('A project for testing');
    expect(result.organization_id).toEqual(testOrganizationId);
    expect(result.created_by).toEqual(testUserId);
    expect(result.status).toEqual('active');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a project with null description', async () => {
    const testInput: CreateProjectInput = {
      name: 'Test Project No Description',
      organization_id: testOrganizationId,
      created_by: testUserId
    };

    const result = await createProject(testInput);

    expect(result.name).toEqual('Test Project No Description');
    expect(result.description).toBeNull();
    expect(result.organization_id).toEqual(testOrganizationId);
    expect(result.created_by).toEqual(testUserId);
    expect(result.status).toEqual('active');
  });

  it('should save project to database', async () => {
    const testInput: CreateProjectInput = {
      name: 'Database Test Project',
      description: 'Testing database persistence',
      organization_id: testOrganizationId,
      created_by: testUserId
    };

    const result = await createProject(testInput);

    const projects = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.id, result.id))
      .execute();

    expect(projects).toHaveLength(1);
    expect(projects[0].name).toEqual('Database Test Project');
    expect(projects[0].description).toEqual('Testing database persistence');
    expect(projects[0].organization_id).toEqual(testOrganizationId);
    expect(projects[0].created_by).toEqual(testUserId);
    expect(projects[0].status).toEqual('active');
    expect(projects[0].created_at).toBeInstanceOf(Date);
    expect(projects[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create project creator as owner in project_members table', async () => {
    const testInput: CreateProjectInput = {
      name: 'Owner Test Project',
      description: 'Testing project membership creation',
      organization_id: testOrganizationId,
      created_by: testUserId
    };

    const result = await createProject(testInput);

    const projectMembers = await db.select()
      .from(projectMembersTable)
      .where(eq(projectMembersTable.project_id, result.id))
      .execute();

    expect(projectMembers).toHaveLength(1);
    expect(projectMembers[0].project_id).toEqual(result.id);
    expect(projectMembers[0].user_id).toEqual(testUserId);
    expect(projectMembers[0].role).toEqual('owner');
    expect(projectMembers[0].added_by).toEqual(testUserId);
    expect(projectMembers[0].created_at).toBeInstanceOf(Date);
  });

  it('should create multiple projects for the same organization', async () => {
    const testInput1: CreateProjectInput = {
      name: 'First Project',
      description: 'First test project',
      organization_id: testOrganizationId,
      created_by: testUserId
    };

    const testInput2: CreateProjectInput = {
      name: 'Second Project',
      description: 'Second test project',
      organization_id: testOrganizationId,
      created_by: testUserId
    };

    const result1 = await createProject(testInput1);
    const result2 = await createProject(testInput2);

    expect(result1.id).not.toEqual(result2.id);
    expect(result1.name).toEqual('First Project');
    expect(result2.name).toEqual('Second Project');
    expect(result1.organization_id).toEqual(testOrganizationId);
    expect(result2.organization_id).toEqual(testOrganizationId);

    // Verify both projects have owner memberships
    const project1Members = await db.select()
      .from(projectMembersTable)
      .where(eq(projectMembersTable.project_id, result1.id))
      .execute();

    const project2Members = await db.select()
      .from(projectMembersTable)
      .where(eq(projectMembersTable.project_id, result2.id))
      .execute();

    expect(project1Members).toHaveLength(1);
    expect(project2Members).toHaveLength(1);
    expect(project1Members[0].role).toEqual('owner');
    expect(project2Members[0].role).toEqual('owner');
  });
});

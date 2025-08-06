
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { organizationsTable, usersTable, projectsTable, projectMembersTable } from '../db/schema';
import { getProjectsByUser } from '../handlers/get_projects_by_user';

describe('getProjectsByUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return projects where user is a member', async () => {
    // Create test organization
    const [org] = await db.insert(organizationsTable)
      .values({
        name: 'Test Org',
        description: 'Test organization'
      })
      .returning()
      .execute();

    // Create test users
    const [user1] = await db.insert(usersTable)
      .values({
        email: 'user1@test.com',
        name: 'User One',
        role: 'member',
        organization_id: org.id
      })
      .returning()
      .execute();

    const [user2] = await db.insert(usersTable)
      .values({
        email: 'user2@test.com',
        name: 'User Two',
        role: 'member',
        organization_id: org.id
      })
      .returning()
      .execute();

    // Create test projects
    const [project1] = await db.insert(projectsTable)
      .values({
        name: 'Project One',
        description: 'First project',
        organization_id: org.id,
        created_by: user1.id,
        status: 'active'
      })
      .returning()
      .execute();

    const [project2] = await db.insert(projectsTable)
      .values({
        name: 'Project Two',
        description: 'Second project',
        organization_id: org.id,
        created_by: user2.id,
        status: 'active'
      })
      .returning()
      .execute();

    const [project3] = await db.insert(projectsTable)
      .values({
        name: 'Project Three',
        description: 'Third project',
        organization_id: org.id,
        created_by: user1.id,
        status: 'inactive'
      })
      .returning()
      .execute();

    // Add user1 as member to project1 and project2
    await db.insert(projectMembersTable)
      .values([
        {
          project_id: project1.id,
          user_id: user1.id,
          role: 'owner',
          added_by: user1.id
        },
        {
          project_id: project2.id,
          user_id: user1.id,
          role: 'editor',
          added_by: user2.id
        }
      ])
      .execute();

    // Add user2 as member to project2 only
    await db.insert(projectMembersTable)
      .values({
        project_id: project2.id,
        user_id: user2.id,
        role: 'owner',
        added_by: user2.id
      })
      .execute();

    // Get projects for user1 - should return project1 and project2
    const user1Projects = await getProjectsByUser(user1.id);

    expect(user1Projects).toHaveLength(2);
    expect(user1Projects.map(p => p.name).sort()).toEqual(['Project One', 'Project Two']);
    expect(user1Projects.find(p => p.id === project1.id)).toBeDefined();
    expect(user1Projects.find(p => p.id === project2.id)).toBeDefined();
    expect(user1Projects.find(p => p.id === project3.id)).toBeUndefined();

    // Get projects for user2 - should return project2 only
    const user2Projects = await getProjectsByUser(user2.id);

    expect(user2Projects).toHaveLength(1);
    expect(user2Projects[0].name).toEqual('Project Two');
    expect(user2Projects[0].id).toEqual(project2.id);
  });

  it('should return empty array when user has no project memberships', async () => {
    // Create test organization
    const [org] = await db.insert(organizationsTable)
      .values({
        name: 'Test Org',
        description: 'Test organization'
      })
      .returning()
      .execute();

    // Create test user
    const [user] = await db.insert(usersTable)
      .values({
        email: 'user@test.com',
        name: 'User',
        role: 'member',
        organization_id: org.id
      })
      .returning()
      .execute();

    // Create a project but don't add user as member
    await db.insert(projectsTable)
      .values({
        name: 'Project One',
        description: 'First project',
        organization_id: org.id,
        created_by: user.id,
        status: 'active'
      })
      .execute();

    const result = await getProjectsByUser(user.id);

    expect(result).toHaveLength(0);
  });

  it('should return projects with all required fields', async () => {
    // Create test organization
    const [org] = await db.insert(organizationsTable)
      .values({
        name: 'Test Org',
        description: 'Test organization'
      })
      .returning()
      .execute();

    // Create test user
    const [user] = await db.insert(usersTable)
      .values({
        email: 'user@test.com',
        name: 'User',
        role: 'member',
        organization_id: org.id
      })
      .returning()
      .execute();

    // Create test project
    const [project] = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        description: 'Test project description',
        organization_id: org.id,
        created_by: user.id,
        status: 'active'
      })
      .returning()
      .execute();

    // Add user as member
    await db.insert(projectMembersTable)
      .values({
        project_id: project.id,
        user_id: user.id,
        role: 'owner',
        added_by: user.id
      })
      .execute();

    const result = await getProjectsByUser(user.id);

    expect(result).toHaveLength(1);
    const returnedProject = result[0];

    // Verify all required fields are present and correct
    expect(returnedProject.id).toEqual(project.id);
    expect(returnedProject.name).toEqual('Test Project');
    expect(returnedProject.description).toEqual('Test project description');
    expect(returnedProject.organization_id).toEqual(org.id);
    expect(returnedProject.created_by).toEqual(user.id);
    expect(returnedProject.status).toEqual('active');
    expect(returnedProject.created_at).toBeInstanceOf(Date);
    expect(returnedProject.updated_at).toBeInstanceOf(Date);
  });
});

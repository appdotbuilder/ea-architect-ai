
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { organizationsTable, usersTable, projectsTable, projectMembersTable } from '../db/schema';
import { getProjectMembers } from '../handlers/get_project_members';

describe('getProjectMembers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when project has no members', async () => {
    // Create organization and user
    const org = await db.insert(organizationsTable)
      .values({ name: 'Test Org' })
      .returning()
      .execute();

    const user = await db.insert(usersTable)
      .values({
        email: 'creator@test.com',
        name: 'Creator',
        role: 'admin',
        organization_id: org[0].id
      })
      .returning()
      .execute();

    // Create project
    const project = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        organization_id: org[0].id,
        created_by: user[0].id
      })
      .returning()
      .execute();

    const result = await getProjectMembers(project[0].id);

    expect(result).toEqual([]);
  });

  it('should return project members for a project', async () => {
    // Create organization
    const org = await db.insert(organizationsTable)
      .values({ name: 'Test Org' })
      .returning()
      .execute();

    // Create users
    const users = await db.insert(usersTable)
      .values([
        {
          email: 'creator@test.com',
          name: 'Creator',
          role: 'admin',
          organization_id: org[0].id
        },
        {
          email: 'member1@test.com',
          name: 'Member One',
          role: 'member',
          organization_id: org[0].id
        },
        {
          email: 'member2@test.com',
          name: 'Member Two',
          role: 'member',
          organization_id: org[0].id
        }
      ])
      .returning()
      .execute();

    // Create project
    const project = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        organization_id: org[0].id,
        created_by: users[0].id
      })
      .returning()
      .execute();

    // Add project members
    const members = await db.insert(projectMembersTable)
      .values([
        {
          project_id: project[0].id,
          user_id: users[1].id,
          role: 'editor',
          added_by: users[0].id
        },
        {
          project_id: project[0].id,
          user_id: users[2].id,
          role: 'viewer',
          added_by: users[0].id
        }
      ])
      .returning()
      .execute();

    const result = await getProjectMembers(project[0].id);

    expect(result).toHaveLength(2);

    // Check first member
    expect(result[0].id).toBeDefined();
    expect(result[0].project_id).toEqual(project[0].id);
    expect(result[0].user_id).toEqual(users[1].id);
    expect(result[0].role).toEqual('editor');
    expect(result[0].added_by).toEqual(users[0].id);
    expect(result[0].created_at).toBeInstanceOf(Date);

    // Check second member
    expect(result[1].id).toBeDefined();
    expect(result[1].project_id).toEqual(project[0].id);
    expect(result[1].user_id).toEqual(users[2].id);
    expect(result[1].role).toEqual('viewer');
    expect(result[1].added_by).toEqual(users[0].id);
    expect(result[1].created_at).toBeInstanceOf(Date);
  });

  it('should return members only for specified project', async () => {
    // Create organization
    const org = await db.insert(organizationsTable)
      .values({ name: 'Test Org' })
      .returning()
      .execute();

    // Create users
    const users = await db.insert(usersTable)
      .values([
        {
          email: 'creator@test.com',
          name: 'Creator',
          role: 'admin',
          organization_id: org[0].id
        },
        {
          email: 'member1@test.com',
          name: 'Member One',
          role: 'member',
          organization_id: org[0].id
        },
        {
          email: 'member2@test.com',
          name: 'Member Two',
          role: 'member',
          organization_id: org[0].id
        }
      ])
      .returning()
      .execute();

    // Create two projects
    const projects = await db.insert(projectsTable)
      .values([
        {
          name: 'Project One',
          organization_id: org[0].id,
          created_by: users[0].id
        },
        {
          name: 'Project Two',
          organization_id: org[0].id,
          created_by: users[0].id
        }
      ])
      .returning()
      .execute();

    // Add members to both projects
    await db.insert(projectMembersTable)
      .values([
        {
          project_id: projects[0].id,
          user_id: users[1].id,
          role: 'editor',
          added_by: users[0].id
        },
        {
          project_id: projects[1].id,
          user_id: users[2].id,
          role: 'viewer',
          added_by: users[0].id
        }
      ])
      .execute();

    const result = await getProjectMembers(projects[0].id);

    expect(result).toHaveLength(1);
    expect(result[0].project_id).toEqual(projects[0].id);
    expect(result[0].user_id).toEqual(users[1].id);
    expect(result[0].role).toEqual('editor');
  });

  it('should return empty array for non-existent project', async () => {
    const result = await getProjectMembers(999);
    expect(result).toEqual([]);
  });
});

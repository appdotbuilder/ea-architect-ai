
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { organizationsTable, projectsTable, usersTable } from '../db/schema';
import { getProjectsByOrganization } from '../handlers/get_projects_by_organization';

describe('getProjectsByOrganization', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all projects for an organization', async () => {
    // Create test organization
    const organization = await db.insert(organizationsTable)
      .values({
        name: 'Test Org',
        description: 'Test organization'
      })
      .returning()
      .execute();

    // Create test user (needed for foreign key)
    const user = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
        organization_id: organization[0].id
      })
      .returning()
      .execute();

    // Create multiple projects for the organization
    await db.insert(projectsTable)
      .values([
        {
          name: 'Project 1',
          description: 'First project',
          organization_id: organization[0].id,
          created_by: user[0].id,
          status: 'active'
        },
        {
          name: 'Project 2',
          description: 'Second project',
          organization_id: organization[0].id,
          created_by: user[0].id,
          status: 'inactive'
        }
      ])
      .execute();

    const result = await getProjectsByOrganization(organization[0].id);

    expect(result).toHaveLength(2);
    expect(result[0].name).toEqual('Project 1');
    expect(result[0].organization_id).toEqual(organization[0].id);
    expect(result[0].status).toEqual('active');
    expect(result[1].name).toEqual('Project 2');
    expect(result[1].organization_id).toEqual(organization[0].id);
    expect(result[1].status).toEqual('inactive');
  });

  it('should return empty array when organization has no projects', async () => {
    // Create test organization without projects
    const organization = await db.insert(organizationsTable)
      .values({
        name: 'Empty Org',
        description: 'Organization with no projects'
      })
      .returning()
      .execute();

    const result = await getProjectsByOrganization(organization[0].id);

    expect(result).toHaveLength(0);
  });

  it('should only return projects for the specified organization', async () => {
    // Create two organizations
    const organizations = await db.insert(organizationsTable)
      .values([
        {
          name: 'Org 1',
          description: 'First organization'
        },
        {
          name: 'Org 2', 
          description: 'Second organization'
        }
      ])
      .returning()
      .execute();

    // Create users for both organizations
    const users = await db.insert(usersTable)
      .values([
        {
          email: 'user1@example.com',
          name: 'User 1',
          role: 'admin',
          organization_id: organizations[0].id
        },
        {
          email: 'user2@example.com',
          name: 'User 2',
          role: 'admin',
          organization_id: organizations[1].id
        }
      ])
      .returning()
      .execute();

    // Create projects for both organizations
    await db.insert(projectsTable)
      .values([
        {
          name: 'Org 1 Project',
          description: 'Project for first org',
          organization_id: organizations[0].id,
          created_by: users[0].id
        },
        {
          name: 'Org 2 Project',
          description: 'Project for second org',
          organization_id: organizations[1].id,
          created_by: users[1].id
        }
      ])
      .execute();

    const result = await getProjectsByOrganization(organizations[0].id);

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Org 1 Project');
    expect(result[0].organization_id).toEqual(organizations[0].id);
  });

  it('should return projects with all expected fields', async () => {
    // Create test organization and user
    const organization = await db.insert(organizationsTable)
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
        organization_id: organization[0].id
      })
      .returning()
      .execute();

    // Create project
    await db.insert(projectsTable)
      .values({
        name: 'Complete Project',
        description: 'Project with all fields',
        organization_id: organization[0].id,
        created_by: user[0].id,
        status: 'archived'
      })
      .execute();

    const result = await getProjectsByOrganization(organization[0].id);

    expect(result).toHaveLength(1);
    const project = result[0];
    
    expect(project.id).toBeDefined();
    expect(project.name).toEqual('Complete Project');
    expect(project.description).toEqual('Project with all fields');
    expect(project.organization_id).toEqual(organization[0].id);
    expect(project.created_by).toEqual(user[0].id);
    expect(project.status).toEqual('archived');
    expect(project.created_at).toBeInstanceOf(Date);
    expect(project.updated_at).toBeInstanceOf(Date);
  });
});

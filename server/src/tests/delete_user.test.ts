
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, organizationsTable, projectsTable, componentsTable, artifactsTable, componentRelationshipsTable, projectMembersTable } from '../db/schema';
import { deleteUser } from '../handlers/delete_user';
import { eq } from 'drizzle-orm';

describe('deleteUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a user with no dependencies', async () => {
    // Create an organization first
    const orgResult = await db.insert(organizationsTable)
      .values({
        name: 'Test Org',
        description: 'Test organization'
      })
      .returning()
      .execute();

    // Create a user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        role: 'member',
        organization_id: orgResult[0].id
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Delete the user
    await deleteUser(userId);

    // Verify user is deleted
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    expect(users).toHaveLength(0);
  });

  it('should throw error when user does not exist', async () => {
    await expect(deleteUser(999)).rejects.toThrow(/User with id 999 not found/i);
  });

  it('should prevent deletion when user has created projects', async () => {
    // Create organization
    const orgResult = await db.insert(organizationsTable)
      .values({
        name: 'Test Org',
        description: 'Test organization'
      })
      .returning()
      .execute();

    // Create user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'creator@example.com',
        name: 'Project Creator',
        role: 'admin',
        organization_id: orgResult[0].id
      })
      .returning()
      .execute();

    // Create project by this user
    await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        description: 'A test project',
        organization_id: orgResult[0].id,
        created_by: userResult[0].id
      })
      .execute();

    // Attempt to delete user should fail
    await expect(deleteUser(userResult[0].id))
      .rejects.toThrow(/Cannot delete user: user has created 1 project\(s\)/i);
  });

  it('should prevent deletion when user has created components', async () => {
    // Create organization
    const orgResult = await db.insert(organizationsTable)
      .values({
        name: 'Test Org',
        description: 'Test organization'
      })
      .returning()
      .execute();

    // Create users
    const userResults = await db.insert(usersTable)
      .values([
        {
          email: 'creator@example.com',
          name: 'Component Creator',
          role: 'admin',
          organization_id: orgResult[0].id
        },
        {
          email: 'project_creator@example.com',
          name: 'Project Creator',
          role: 'admin',
          organization_id: orgResult[0].id
        }
      ])
      .returning()
      .execute();

    const componentCreatorId = userResults[0].id;
    const projectCreatorId = userResults[1].id;

    // Create project
    const projectResult = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        description: 'A test project',
        organization_id: orgResult[0].id,
        created_by: projectCreatorId
      })
      .returning()
      .execute();

    // Create component by the first user
    await db.insert(componentsTable)
      .values({
        name: 'Test Component',
        description: 'A test component',
        type: 'application',
        layer: 'application',
        project_id: projectResult[0].id,
        created_by: componentCreatorId
      })
      .execute();

    // Attempt to delete component creator should fail
    await expect(deleteUser(componentCreatorId))
      .rejects.toThrow(/Cannot delete user: user has created 1 component\(s\)/i);
  });

  it('should prevent deletion when user has uploaded artifacts', async () => {
    // Create organization
    const orgResult = await db.insert(organizationsTable)
      .values({
        name: 'Test Org',
        description: 'Test organization'
      })
      .returning()
      .execute();

    // Create users
    const userResults = await db.insert(usersTable)
      .values([
        {
          email: 'uploader@example.com',
          name: 'Artifact Uploader',
          role: 'member',
          organization_id: orgResult[0].id
        },
        {
          email: 'project_creator@example.com',
          name: 'Project Creator',
          role: 'admin',
          organization_id: orgResult[0].id
        }
      ])
      .returning()
      .execute();

    const uploaderId = userResults[0].id;
    const projectCreatorId = userResults[1].id;

    // Create project
    const projectResult = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        description: 'A test project',
        organization_id: orgResult[0].id,
        created_by: projectCreatorId
      })
      .returning()
      .execute();

    // Upload artifact by the first user
    await db.insert(artifactsTable)
      .values({
        name: 'Test Artifact',
        description: 'A test artifact',
        file_path: '/test/path.pdf',
        file_type: 'application/pdf',
        file_size: 1024,
        project_id: projectResult[0].id,
        uploaded_by: uploaderId
      })
      .execute();

    // Attempt to delete uploader should fail
    await expect(deleteUser(uploaderId))
      .rejects.toThrow(/Cannot delete user: user has uploaded 1 artifact\(s\)/i);
  });

  it('should prevent deletion when user has project memberships', async () => {
    // Create organization
    const orgResult = await db.insert(organizationsTable)
      .values({
        name: 'Test Org',
        description: 'Test organization'
      })
      .returning()
      .execute();

    // Create users
    const userResults = await db.insert(usersTable)
      .values([
        {
          email: 'member@example.com',
          name: 'Project Member',
          role: 'member',
          organization_id: orgResult[0].id
        },
        {
          email: 'project_creator@example.com',
          name: 'Project Creator',
          role: 'admin',
          organization_id: orgResult[0].id
        }
      ])
      .returning()
      .execute();

    const memberId = userResults[0].id;
    const projectCreatorId = userResults[1].id;

    // Create project
    const projectResult = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        description: 'A test project',
        organization_id: orgResult[0].id,
        created_by: projectCreatorId
      })
      .returning()
      .execute();

    // Add user as project member
    await db.insert(projectMembersTable)
      .values({
        project_id: projectResult[0].id,
        user_id: memberId,
        role: 'viewer',
        added_by: projectCreatorId
      })
      .execute();

    // Attempt to delete member should fail
    await expect(deleteUser(memberId))
      .rejects.toThrow(/Cannot delete user: user has 1 project membership\(s\) or has added other members/i);
  });

  it('should verify user is actually removed from database', async () => {
    // Create organization
    const orgResult = await db.insert(organizationsTable)
      .values({
        name: 'Test Org',
        description: 'Test organization'
      })
      .returning()
      .execute();

    // Create user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'delete@example.com',
        name: 'User To Delete',
        role: 'member',
        organization_id: orgResult[0].id
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Verify user exists before deletion
    const usersBefore = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    expect(usersBefore).toHaveLength(1);

    // Delete the user
    await deleteUser(userId);

    // Verify user is gone
    const usersAfter = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    expect(usersAfter).toHaveLength(0);
  });
});

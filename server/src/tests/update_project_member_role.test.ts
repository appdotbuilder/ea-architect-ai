
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { organizationsTable, usersTable, projectsTable, projectMembersTable } from '../db/schema';
import { updateProjectMemberRole } from '../handlers/update_project_member_role';
import { eq, and } from 'drizzle-orm';

describe('updateProjectMemberRole', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a project member role', async () => {
    // Create prerequisite data
    const org = await db.insert(organizationsTable)
      .values({ name: 'Test Org', description: 'Test organization' })
      .returning()
      .execute();

    const user1 = await db.insert(usersTable)
      .values({ 
        email: 'creator@test.com', 
        name: 'Creator', 
        role: 'admin',
        organization_id: org[0].id
      })
      .returning()
      .execute();

    const user2 = await db.insert(usersTable)
      .values({ 
        email: 'member@test.com', 
        name: 'Member', 
        role: 'member',
        organization_id: org[0].id
      })
      .returning()
      .execute();

    const project = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        description: 'Test project',
        organization_id: org[0].id,
        created_by: user1[0].id
      })
      .returning()
      .execute();

    const member = await db.insert(projectMembersTable)
      .values({
        project_id: project[0].id,
        user_id: user2[0].id,
        role: 'viewer',
        added_by: user1[0].id
      })
      .returning()
      .execute();

    // Update the member's role
    const result = await updateProjectMemberRole(project[0].id, user2[0].id, 'editor');

    // Verify the result
    expect(result.id).toBe(member[0].id);
    expect(result.project_id).toBe(project[0].id);
    expect(result.user_id).toBe(user2[0].id);
    expect(result.role).toBe('editor');
    expect(result.added_by).toBe(user1[0].id);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save updated role to database', async () => {
    // Create prerequisite data
    const org = await db.insert(organizationsTable)
      .values({ name: 'Test Org', description: 'Test organization' })
      .returning()
      .execute();

    const user1 = await db.insert(usersTable)
      .values({ 
        email: 'creator@test.com', 
        name: 'Creator', 
        role: 'admin',
        organization_id: org[0].id
      })
      .returning()
      .execute();

    const user2 = await db.insert(usersTable)
      .values({ 
        email: 'member@test.com', 
        name: 'Member', 
        role: 'member',
        organization_id: org[0].id
      })
      .returning()
      .execute();

    const project = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        description: 'Test project',
        organization_id: org[0].id,
        created_by: user1[0].id
      })
      .returning()
      .execute();

    await db.insert(projectMembersTable)
      .values({
        project_id: project[0].id,
        user_id: user2[0].id,
        role: 'viewer',
        added_by: user1[0].id
      })
      .execute();

    // Update the role
    await updateProjectMemberRole(project[0].id, user2[0].id, 'owner');

    // Query the database to verify the change
    const updatedMember = await db.select()
      .from(projectMembersTable)
      .where(
        and(
          eq(projectMembersTable.project_id, project[0].id),
          eq(projectMembersTable.user_id, user2[0].id)
        )
      )
      .execute();

    expect(updatedMember).toHaveLength(1);
    expect(updatedMember[0].role).toBe('owner');
  });

  it('should throw error when project member not found', async () => {
    // Create prerequisite data
    const org = await db.insert(organizationsTable)
      .values({ name: 'Test Org', description: 'Test organization' })
      .returning()
      .execute();

    const user = await db.insert(usersTable)
      .values({ 
        email: 'user@test.com', 
        name: 'User', 
        role: 'member',
        organization_id: org[0].id
      })
      .returning()
      .execute();

    const project = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        description: 'Test project',
        organization_id: org[0].id,
        created_by: user[0].id
      })
      .returning()
      .execute();

    // Try to update a non-existent project member
    await expect(
      updateProjectMemberRole(project[0].id, 999, 'editor')
    ).rejects.toThrow(/project member not found/i);
  });

  it('should update role from editor to viewer', async () => {
    // Create prerequisite data
    const org = await db.insert(organizationsTable)
      .values({ name: 'Test Org', description: 'Test organization' })
      .returning()
      .execute();

    const user1 = await db.insert(usersTable)
      .values({ 
        email: 'creator@test.com', 
        name: 'Creator', 
        role: 'admin',
        organization_id: org[0].id
      })
      .returning()
      .execute();

    const user2 = await db.insert(usersTable)
      .values({ 
        email: 'member@test.com', 
        name: 'Member', 
        role: 'member',
        organization_id: org[0].id
      })
      .returning()
      .execute();

    const project = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        description: 'Test project',
        organization_id: org[0].id,
        created_by: user1[0].id
      })
      .returning()
      .execute();

    await db.insert(projectMembersTable)
      .values({
        project_id: project[0].id,
        user_id: user2[0].id,
        role: 'editor',
        added_by: user1[0].id
      })
      .execute();

    // Update role from editor to viewer
    const result = await updateProjectMemberRole(project[0].id, user2[0].id, 'viewer');

    expect(result.role).toBe('viewer');
    expect(result.project_id).toBe(project[0].id);
    expect(result.user_id).toBe(user2[0].id);
  });
});

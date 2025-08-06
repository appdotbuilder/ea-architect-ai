
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { 
  organizationsTable, 
  usersTable, 
  projectsTable, 
  projectMembersTable 
} from '../db/schema';
import { removeProjectMember } from '../handlers/remove_project_member';
import { eq, and } from 'drizzle-orm';

describe('removeProjectMember', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let organizationId: number;
  let userId1: number;
  let userId2: number;
  let userId3: number;
  let projectId: number;

  beforeEach(async () => {
    // Create organization
    const orgResult = await db.insert(organizationsTable)
      .values({
        name: 'Test Organization',
        description: 'Test description'
      })
      .returning()
      .execute();
    organizationId = orgResult[0].id;

    // Create users
    const userResults = await db.insert(usersTable)
      .values([
        {
          email: 'user1@test.com',
          name: 'User One',
          role: 'admin',
          organization_id: organizationId
        },
        {
          email: 'user2@test.com',
          name: 'User Two',
          role: 'member',
          organization_id: organizationId
        },
        {
          email: 'user3@test.com',
          name: 'User Three',
          role: 'member',
          organization_id: organizationId
        }
      ])
      .returning()
      .execute();
    
    userId1 = userResults[0].id;
    userId2 = userResults[1].id;
    userId3 = userResults[2].id;

    // Create project
    const projectResult = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        description: 'Test description',
        organization_id: organizationId,
        created_by: userId1
      })
      .returning()
      .execute();
    projectId = projectResult[0].id;

    // Add project members
    await db.insert(projectMembersTable)
      .values([
        {
          project_id: projectId,
          user_id: userId1,
          role: 'owner',
          added_by: userId1
        },
        {
          project_id: projectId,
          user_id: userId2,
          role: 'editor',
          added_by: userId1
        },
        {
          project_id: projectId,
          user_id: userId3,
          role: 'viewer',
          added_by: userId1
        }
      ])
      .execute();
  });

  it('should remove a non-owner member successfully', async () => {
    await removeProjectMember(projectId, userId2);

    // Verify member was removed
    const remainingMembers = await db.select()
      .from(projectMembersTable)
      .where(eq(projectMembersTable.project_id, projectId))
      .execute();

    expect(remainingMembers).toHaveLength(2);
    expect(remainingMembers.find(m => m.user_id === userId2)).toBeUndefined();
    expect(remainingMembers.find(m => m.user_id === userId1)).toBeDefined();
    expect(remainingMembers.find(m => m.user_id === userId3)).toBeDefined();
  });

  it('should remove an owner when there are multiple owners', async () => {
    // Update userId2 to be an owner (instead of trying to insert duplicate)
    await db.update(projectMembersTable)
      .set({ role: 'owner' })
      .where(
        and(
          eq(projectMembersTable.project_id, projectId),
          eq(projectMembersTable.user_id, userId2)
        )
      )
      .execute();

    await removeProjectMember(projectId, userId1);

    // Verify owner was removed
    const remainingMembers = await db.select()
      .from(projectMembersTable)
      .where(eq(projectMembersTable.project_id, projectId))
      .execute();

    expect(remainingMembers).toHaveLength(2);
    expect(remainingMembers.find(m => m.user_id === userId1)).toBeUndefined();
    
    // Verify there's still an owner (userId2)
    const owners = remainingMembers.filter(m => m.role === 'owner');
    expect(owners).toHaveLength(1);
    expect(owners[0].user_id).toBe(userId2);
  });

  it('should throw error when removing the last owner', async () => {
    await expect(removeProjectMember(projectId, userId1))
      .rejects.toThrow(/cannot remove the last owner/i);

    // Verify member was not removed
    const members = await db.select()
      .from(projectMembersTable)
      .where(eq(projectMembersTable.project_id, projectId))
      .execute();

    expect(members).toHaveLength(3);
    expect(members.find(m => m.user_id === userId1)).toBeDefined();
  });

  it('should throw error when user is not a project member', async () => {
    // Create another user not in the project
    const userResult = await db.insert(usersTable)
      .values({
        email: 'outsider@test.com',
        name: 'Outsider',
        role: 'member',
        organization_id: organizationId
      })
      .returning()
      .execute();

    await expect(removeProjectMember(projectId, userResult[0].id))
      .rejects.toThrow(/user is not a member/i);
  });

  it('should throw error when project does not exist', async () => {
    await expect(removeProjectMember(9999, userId1))
      .rejects.toThrow(/user is not a member/i);
  });
});

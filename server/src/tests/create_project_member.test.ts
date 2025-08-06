
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { 
  organizationsTable, 
  usersTable, 
  projectsTable, 
  projectMembersTable 
} from '../db/schema';
import { type CreateProjectMemberInput } from '../schema';
import { createProjectMember } from '../handlers/create_project_member';
import { eq, and } from 'drizzle-orm';

describe('createProjectMember', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let organizationId: number;
  let userId: number;
  let addingUserId: number;
  let projectId: number;

  beforeEach(async () => {
    // Create organization
    const orgResult = await db.insert(organizationsTable)
      .values({
        name: 'Test Organization',
        description: 'A test organization'
      })
      .returning()
      .execute();
    organizationId = orgResult[0].id;

    // Create user to be added as member
    const userResult = await db.insert(usersTable)
      .values({
        email: 'member@test.com',
        name: 'Test Member',
        role: 'member',
        organization_id: organizationId
      })
      .returning()
      .execute();
    userId = userResult[0].id;

    // Create user who will add the member
    const addingUserResult = await db.insert(usersTable)
      .values({
        email: 'admin@test.com',
        name: 'Test Admin',
        role: 'admin',
        organization_id: organizationId
      })
      .returning()
      .execute();
    addingUserId = addingUserResult[0].id;

    // Create project
    const projectResult = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        description: 'A test project',
        organization_id: organizationId,
        created_by: addingUserId
      })
      .returning()
      .execute();
    projectId = projectResult[0].id;
  });

  const testInput: CreateProjectMemberInput = {
    project_id: 0, // Will be set in beforeEach
    user_id: 0, // Will be set in beforeEach
    role: 'viewer',
    added_by: 0 // Will be set in beforeEach
  };

  it('should create a project member', async () => {
    const input = {
      ...testInput,
      project_id: projectId,
      user_id: userId,
      added_by: addingUserId
    };

    const result = await createProjectMember(input);

    expect(result.project_id).toEqual(projectId);
    expect(result.user_id).toEqual(userId);
    expect(result.role).toEqual('viewer');
    expect(result.added_by).toEqual(addingUserId);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save project member to database', async () => {
    const input = {
      ...testInput,
      project_id: projectId,
      user_id: userId,
      added_by: addingUserId
    };

    const result = await createProjectMember(input);

    const members = await db.select()
      .from(projectMembersTable)
      .where(eq(projectMembersTable.id, result.id))
      .execute();

    expect(members).toHaveLength(1);
    expect(members[0].project_id).toEqual(projectId);
    expect(members[0].user_id).toEqual(userId);
    expect(members[0].role).toEqual('viewer');
    expect(members[0].added_by).toEqual(addingUserId);
    expect(members[0].created_at).toBeInstanceOf(Date);
  });

  it('should create project member with different roles', async () => {
    const editorInput = {
      ...testInput,
      project_id: projectId,
      user_id: userId,
      role: 'editor' as const,
      added_by: addingUserId
    };

    const result = await createProjectMember(editorInput);

    expect(result.role).toEqual('editor');

    // Verify in database
    const members = await db.select()
      .from(projectMembersTable)
      .where(eq(projectMembersTable.id, result.id))
      .execute();

    expect(members[0].role).toEqual('editor');
  });

  it('should throw error when project does not exist', async () => {
    const input = {
      ...testInput,
      project_id: 99999,
      user_id: userId,
      added_by: addingUserId
    };

    await expect(createProjectMember(input)).rejects.toThrow(/project not found/i);
  });

  it('should throw error when user does not exist', async () => {
    const input = {
      ...testInput,
      project_id: projectId,
      user_id: 99999,
      added_by: addingUserId
    };

    await expect(createProjectMember(input)).rejects.toThrow(/user not found/i);
  });

  it('should throw error when adding user does not exist', async () => {
    const input = {
      ...testInput,
      project_id: projectId,
      user_id: userId,
      added_by: 99999
    };

    await expect(createProjectMember(input)).rejects.toThrow(/user who is adding the member not found/i);
  });

  it('should throw error when user is already a member', async () => {
    const input = {
      ...testInput,
      project_id: projectId,
      user_id: userId,
      added_by: addingUserId
    };

    // Create the member first time
    await createProjectMember(input);

    // Try to create the same member again
    await expect(createProjectMember(input)).rejects.toThrow(/user is already a member of this project/i);
  });

  it('should allow same user to be member of different projects', async () => {
    // Create another project
    const secondProjectResult = await db.insert(projectsTable)
      .values({
        name: 'Second Test Project',
        description: 'Another test project',
        organization_id: organizationId,
        created_by: addingUserId
      })
      .returning()
      .execute();
    const secondProjectId = secondProjectResult[0].id;

    const firstInput = {
      ...testInput,
      project_id: projectId,
      user_id: userId,
      added_by: addingUserId
    };

    const secondInput = {
      ...testInput,
      project_id: secondProjectId,
      user_id: userId,
      added_by: addingUserId
    };

    // Should be able to add same user to different projects
    const firstResult = await createProjectMember(firstInput);
    const secondResult = await createProjectMember(secondInput);

    expect(firstResult.project_id).toEqual(projectId);
    expect(secondResult.project_id).toEqual(secondProjectId);
    expect(firstResult.user_id).toEqual(userId);
    expect(secondResult.user_id).toEqual(userId);
  });
});

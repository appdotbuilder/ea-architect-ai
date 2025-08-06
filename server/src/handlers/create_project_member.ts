
import { db } from '../db';
import { projectMembersTable, projectsTable, usersTable } from '../db/schema';
import { type CreateProjectMemberInput, type ProjectMember } from '../schema';
import { eq, and } from 'drizzle-orm';

export const createProjectMember = async (input: CreateProjectMemberInput): Promise<ProjectMember> => {
  try {
    // Validate that the project exists
    const projects = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.id, input.project_id))
      .execute();

    if (projects.length === 0) {
      throw new Error('Project not found');
    }

    // Validate that the user exists
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();

    if (users.length === 0) {
      throw new Error('User not found');
    }

    // Validate that the user who is adding the member exists
    const addingUsers = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.added_by))
      .execute();

    if (addingUsers.length === 0) {
      throw new Error('User who is adding the member not found');
    }

    // Check if the user is already a member of this project
    const existingMembers = await db.select()
      .from(projectMembersTable)
      .where(and(
        eq(projectMembersTable.project_id, input.project_id),
        eq(projectMembersTable.user_id, input.user_id)
      ))
      .execute();

    if (existingMembers.length > 0) {
      throw new Error('User is already a member of this project');
    }

    // Insert the new project member
    const result = await db.insert(projectMembersTable)
      .values({
        project_id: input.project_id,
        user_id: input.user_id,
        role: input.role,
        added_by: input.added_by
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Project member creation failed:', error);
    throw error;
  }
};

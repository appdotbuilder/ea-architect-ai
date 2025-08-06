
import { db } from '../db';
import { projectMembersTable, usersTable } from '../db/schema';
import { type ProjectMember } from '../schema';
import { eq } from 'drizzle-orm';

export async function getProjectMembers(projectId: number): Promise<ProjectMember[]> {
  try {
    const results = await db.select()
      .from(projectMembersTable)
      .innerJoin(usersTable, eq(projectMembersTable.user_id, usersTable.id))
      .where(eq(projectMembersTable.project_id, projectId))
      .execute();

    return results.map(result => ({
      id: result.project_members.id,
      project_id: result.project_members.project_id,
      user_id: result.project_members.user_id,
      role: result.project_members.role,
      added_by: result.project_members.added_by,
      created_at: result.project_members.created_at
    }));
  } catch (error) {
    console.error('Failed to get project members:', error);
    throw error;
  }
}


import { db } from '../db';
import { projectMembersTable } from '../db/schema';
import { type ProjectMember } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function updateProjectMemberRole(projectId: number, userId: number, newRole: 'owner' | 'editor' | 'viewer'): Promise<ProjectMember> {
  try {
    // Update the project member's role
    const result = await db.update(projectMembersTable)
      .set({
        role: newRole
      })
      .where(
        and(
          eq(projectMembersTable.project_id, projectId),
          eq(projectMembersTable.user_id, userId)
        )
      )
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Project member not found for project ${projectId} and user ${userId}`);
    }

    return result[0];
  } catch (error) {
    console.error('Project member role update failed:', error);
    throw error;
  }
}

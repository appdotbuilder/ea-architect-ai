
import { db } from '../db';
import { projectMembersTable } from '../db/schema';
import { eq, and } from 'drizzle-orm';

export async function removeProjectMember(projectId: number, userId: number): Promise<void> {
  try {
    // First, check if the user is a member of the project
    const existingMember = await db.select()
      .from(projectMembersTable)
      .where(
        and(
          eq(projectMembersTable.project_id, projectId),
          eq(projectMembersTable.user_id, userId)
        )
      )
      .execute();

    if (existingMember.length === 0) {
      throw new Error('User is not a member of this project');
    }

    const memberToRemove = existingMember[0];

    // If the member is an owner, check if there are other owners
    if (memberToRemove.role === 'owner') {
      const allOwners = await db.select()
        .from(projectMembersTable)
        .where(
          and(
            eq(projectMembersTable.project_id, projectId),
            eq(projectMembersTable.role, 'owner')
          )
        )
        .execute();

      if (allOwners.length <= 1) {
        throw new Error('Cannot remove the last owner from the project');
      }
    }

    // Remove the member
    await db.delete(projectMembersTable)
      .where(eq(projectMembersTable.id, memberToRemove.id))
      .execute();
  } catch (error) {
    console.error('Remove project member failed:', error);
    throw error;
  }
}


import { db } from '../db';
import { projectsTable, projectMembersTable } from '../db/schema';
import { type Project } from '../schema';
import { eq } from 'drizzle-orm';

export async function getProjectsByUser(userId: number): Promise<Project[]> {
  try {
    // Join projects with project_members to get user's projects
    const results = await db.select({
      id: projectsTable.id,
      name: projectsTable.name,
      description: projectsTable.description,
      organization_id: projectsTable.organization_id,
      created_by: projectsTable.created_by,
      status: projectsTable.status,
      created_at: projectsTable.created_at,
      updated_at: projectsTable.updated_at
    })
      .from(projectsTable)
      .innerJoin(projectMembersTable, eq(projectsTable.id, projectMembersTable.project_id))
      .where(eq(projectMembersTable.user_id, userId))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to get projects by user:', error);
    throw error;
  }
}

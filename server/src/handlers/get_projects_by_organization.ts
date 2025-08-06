
import { db } from '../db';
import { projectsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type Project } from '../schema';

export const getProjectsByOrganization = async (organizationId: number): Promise<Project[]> => {
  try {
    const results = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.organization_id, organizationId))
      .execute();

    return results;
  } catch (error) {
    console.error('Get projects by organization failed:', error);
    throw error;
  }
};


import { db } from '../db';
import { projectsTable, projectMembersTable } from '../db/schema';
import { type CreateProjectInput, type Project } from '../schema';

export async function createProject(input: CreateProjectInput): Promise<Project> {
  try {
    // Insert project record
    const projectResult = await db.insert(projectsTable)
      .values({
        name: input.name,
        description: input.description || null,
        organization_id: input.organization_id,
        created_by: input.created_by
      })
      .returning()
      .execute();

    const project = projectResult[0];

    // Create project creator as owner in project_members table
    await db.insert(projectMembersTable)
      .values({
        project_id: project.id,
        user_id: input.created_by,
        role: 'owner',
        added_by: input.created_by
      })
      .execute();

    return project;
  } catch (error) {
    console.error('Project creation failed:', error);
    throw error;
  }
}

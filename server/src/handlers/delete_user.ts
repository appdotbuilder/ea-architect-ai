
import { db } from '../db';
import { usersTable, projectsTable, componentsTable, artifactsTable, componentRelationshipsTable, projectMembersTable } from '../db/schema';
import { eq, or } from 'drizzle-orm';

export async function deleteUser(id: number): Promise<void> {
  try {
    // Check if user exists
    const existingUsers = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, id))
      .execute();

    if (existingUsers.length === 0) {
      throw new Error(`User with id ${id} not found`);
    }

    // Check for dependencies that would prevent deletion
    
    // Check for projects created by this user
    const createdProjects = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.created_by, id))
      .execute();

    if (createdProjects.length > 0) {
      throw new Error(`Cannot delete user: user has created ${createdProjects.length} project(s)`);
    }

    // Check for components created by this user
    const createdComponents = await db.select()
      .from(componentsTable)
      .where(eq(componentsTable.created_by, id))
      .execute();

    if (createdComponents.length > 0) {
      throw new Error(`Cannot delete user: user has created ${createdComponents.length} component(s)`);
    }

    // Check for artifacts uploaded by this user
    const uploadedArtifacts = await db.select()
      .from(artifactsTable)
      .where(eq(artifactsTable.uploaded_by, id))
      .execute();

    if (uploadedArtifacts.length > 0) {
      throw new Error(`Cannot delete user: user has uploaded ${uploadedArtifacts.length} artifact(s)`);
    }

    // Check for component relationships created by this user
    const createdRelationships = await db.select()
      .from(componentRelationshipsTable)
      .where(eq(componentRelationshipsTable.created_by, id))
      .execute();

    if (createdRelationships.length > 0) {
      throw new Error(`Cannot delete user: user has created ${createdRelationships.length} component relationship(s)`);
    }

    // Check for project memberships where this user was added by someone or added others
    const projectMemberships = await db.select()
      .from(projectMembersTable)
      .where(or(
        eq(projectMembersTable.user_id, id),
        eq(projectMembersTable.added_by, id)
      ))
      .execute();

    if (projectMemberships.length > 0) {
      throw new Error(`Cannot delete user: user has ${projectMemberships.length} project membership(s) or has added other members`);
    }

    // If no dependencies found, delete the user
    await db.delete(usersTable)
      .where(eq(usersTable.id, id))
      .execute();

  } catch (error) {
    console.error('User deletion failed:', error);
    throw error;
  }
}

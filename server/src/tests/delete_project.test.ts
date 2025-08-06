
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { 
  organizationsTable, 
  usersTable, 
  projectsTable, 
  componentsTable,
  componentRelationshipsTable,
  artifactsTable,
  projectMembersTable 
} from '../db/schema';
import { deleteProject } from '../handlers/delete_project';
import { eq } from 'drizzle-orm';

describe('deleteProject', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a project', async () => {
    // Create prerequisite data
    const orgResult = await db.insert(organizationsTable)
      .values({
        name: 'Test Org',
        description: 'Test organization'
      })
      .returning()
      .execute();

    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
        organization_id: orgResult[0].id
      })
      .returning()
      .execute();

    const projectResult = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        description: 'Test project for deletion',
        organization_id: orgResult[0].id,
        created_by: userResult[0].id,
        status: 'active'
      })
      .returning()
      .execute();

    const projectId = projectResult[0].id;

    // Delete the project
    await deleteProject(projectId);

    // Verify project is deleted
    const projects = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.id, projectId))
      .execute();

    expect(projects).toHaveLength(0);
  });

  it('should delete project with all related data', async () => {
    // Create prerequisite data
    const orgResult = await db.insert(organizationsTable)
      .values({
        name: 'Test Org',
        description: 'Test organization'
      })
      .returning()
      .execute();

    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
        organization_id: orgResult[0].id
      })
      .returning()
      .execute();

    const projectResult = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        description: 'Test project with components',
        organization_id: orgResult[0].id,
        created_by: userResult[0].id,
        status: 'active'
      })
      .returning()
      .execute();

    const projectId = projectResult[0].id;

    // Create components
    const component1Result = await db.insert(componentsTable)
      .values({
        name: 'Component 1',
        description: 'First component',
        type: 'application',
        layer: 'application',
        project_id: projectId,
        created_by: userResult[0].id
      })
      .returning()
      .execute();

    const component2Result = await db.insert(componentsTable)
      .values({
        name: 'Component 2',
        description: 'Second component',
        type: 'service',
        layer: 'application',
        project_id: projectId,
        created_by: userResult[0].id
      })
      .returning()
      .execute();

    // Create component relationship
    await db.insert(componentRelationshipsTable)
      .values({
        source_component_id: component1Result[0].id,
        target_component_id: component2Result[0].id,
        relationship_type: 'depends_on',
        description: 'Component 1 depends on Component 2',
        created_by: userResult[0].id
      })
      .execute();

    // Create artifact
    await db.insert(artifactsTable)
      .values({
        name: 'Test Artifact',
        description: 'Test artifact file',
        file_path: '/test/path/file.pdf',
        file_type: 'application/pdf',
        file_size: 1024,
        component_id: component1Result[0].id,
        project_id: projectId,
        uploaded_by: userResult[0].id
      })
      .execute();

    // Create project member
    await db.insert(projectMembersTable)
      .values({
        project_id: projectId,
        user_id: userResult[0].id,
        role: 'owner',
        added_by: userResult[0].id
      })
      .execute();

    // Delete the project
    await deleteProject(projectId);

    // Verify all related data is deleted
    const projects = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.id, projectId))
      .execute();

    const components = await db.select()
      .from(componentsTable)
      .where(eq(componentsTable.project_id, projectId))
      .execute();

    const relationships = await db.select()
      .from(componentRelationshipsTable)
      .where(eq(componentRelationshipsTable.source_component_id, component1Result[0].id))
      .execute();

    const artifacts = await db.select()
      .from(artifactsTable)
      .where(eq(artifactsTable.project_id, projectId))
      .execute();

    const members = await db.select()
      .from(projectMembersTable)
      .where(eq(projectMembersTable.project_id, projectId))
      .execute();

    expect(projects).toHaveLength(0);
    expect(components).toHaveLength(0);
    expect(relationships).toHaveLength(0);
    expect(artifacts).toHaveLength(0);
    expect(members).toHaveLength(0);
  });

  it('should handle deleting non-existent project', async () => {
    // Should not throw error when deleting non-existent project
    await expect(deleteProject(999)).resolves.toBeUndefined();
  });
});

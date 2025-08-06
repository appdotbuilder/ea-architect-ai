
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { organizationsTable, usersTable, projectsTable, componentsTable, componentRelationshipsTable, artifactsTable, projectMembersTable } from '../db/schema';
import { deleteOrganization } from '../handlers/delete_organization';
import { eq } from 'drizzle-orm';

describe('deleteOrganization', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an organization', async () => {
    // Create organization
    const [organization] = await db.insert(organizationsTable)
      .values({
        name: 'Test Organization',
        description: 'Test organization for deletion'
      })
      .returning()
      .execute();

    // Verify organization exists
    const orgsBefore = await db.select()
      .from(organizationsTable)
      .where(eq(organizationsTable.id, organization.id))
      .execute();
    expect(orgsBefore).toHaveLength(1);

    // Delete organization
    await deleteOrganization(organization.id);

    // Verify organization is deleted
    const orgsAfter = await db.select()
      .from(organizationsTable)
      .where(eq(organizationsTable.id, organization.id))
      .execute();
    expect(orgsAfter).toHaveLength(0);
  });

  it('should cascade delete users in the organization', async () => {
    // Create organization
    const [organization] = await db.insert(organizationsTable)
      .values({
        name: 'Test Organization',
        description: 'Test organization for deletion'
      })
      .returning()
      .execute();

    // Create users in the organization
    const [user1] = await db.insert(usersTable)
      .values({
        email: 'user1@test.com',
        name: 'User 1',
        role: 'member',
        organization_id: organization.id
      })
      .returning()
      .execute();

    const [user2] = await db.insert(usersTable)
      .values({
        email: 'user2@test.com',
        name: 'User 2',
        role: 'admin',
        organization_id: organization.id
      })
      .returning()
      .execute();

    // Verify users exist
    const usersBefore = await db.select()
      .from(usersTable)
      .where(eq(usersTable.organization_id, organization.id))
      .execute();
    expect(usersBefore).toHaveLength(2);

    // Delete organization
    await deleteOrganization(organization.id);

    // Verify users are deleted
    const usersAfter = await db.select()
      .from(usersTable)
      .where(eq(usersTable.organization_id, organization.id))
      .execute();
    expect(usersAfter).toHaveLength(0);
  });

  it('should cascade delete projects and all project dependencies', async () => {
    // Create organization
    const [organization] = await db.insert(organizationsTable)
      .values({
        name: 'Test Organization',
        description: 'Test organization for deletion'
      })
      .returning()
      .execute();

    // Create user
    const [user] = await db.insert(usersTable)
      .values({
        email: 'user@test.com',
        name: 'Test User',
        role: 'admin',
        organization_id: organization.id
      })
      .returning()
      .execute();

    // Create project
    const [project] = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        description: 'Test project for deletion',
        organization_id: organization.id,
        created_by: user.id
      })
      .returning()
      .execute();

    // Create components
    const [component1] = await db.insert(componentsTable)
      .values({
        name: 'Component 1',
        description: 'Test component 1',
        type: 'business_process',
        layer: 'business',
        project_id: project.id,
        created_by: user.id
      })
      .returning()
      .execute();

    const [component2] = await db.insert(componentsTable)
      .values({
        name: 'Component 2',
        description: 'Test component 2',
        type: 'application',
        layer: 'application',
        project_id: project.id,
        created_by: user.id
      })
      .returning()
      .execute();

    // Create component relationship
    const [relationship] = await db.insert(componentRelationshipsTable)
      .values({
        source_component_id: component1.id,
        target_component_id: component2.id,
        relationship_type: 'depends_on',
        description: 'Test relationship',
        created_by: user.id
      })
      .returning()
      .execute();

    // Create artifact
    const [artifact] = await db.insert(artifactsTable)
      .values({
        name: 'Test Artifact',
        description: 'Test artifact for deletion',
        file_path: '/test/path',
        file_type: 'pdf',
        file_size: 1024,
        component_id: component1.id,
        project_id: project.id,
        uploaded_by: user.id
      })
      .returning()
      .execute();

    // Create project member
    const [member] = await db.insert(projectMembersTable)
      .values({
        project_id: project.id,
        user_id: user.id,
        role: 'owner',
        added_by: user.id
      })
      .returning()
      .execute();

    // Verify all entities exist before deletion
    const projectsBefore = await db.select().from(projectsTable).where(eq(projectsTable.id, project.id)).execute();
    expect(projectsBefore).toHaveLength(1);

    const componentsBefore = await db.select().from(componentsTable).where(eq(componentsTable.project_id, project.id)).execute();
    expect(componentsBefore).toHaveLength(2);

    const relationshipsBefore = await db.select().from(componentRelationshipsTable).where(eq(componentRelationshipsTable.id, relationship.id)).execute();
    expect(relationshipsBefore).toHaveLength(1);

    const artifactsBefore = await db.select().from(artifactsTable).where(eq(artifactsTable.id, artifact.id)).execute();
    expect(artifactsBefore).toHaveLength(1);

    const membersBefore = await db.select().from(projectMembersTable).where(eq(projectMembersTable.id, member.id)).execute();
    expect(membersBefore).toHaveLength(1);

    // Delete organization
    await deleteOrganization(organization.id);

    // Verify all entities are deleted
    const projectsAfter = await db.select().from(projectsTable).where(eq(projectsTable.id, project.id)).execute();
    expect(projectsAfter).toHaveLength(0);

    const componentsAfter = await db.select().from(componentsTable).where(eq(componentsTable.project_id, project.id)).execute();
    expect(componentsAfter).toHaveLength(0);

    const relationshipsAfter = await db.select().from(componentRelationshipsTable).where(eq(componentRelationshipsTable.id, relationship.id)).execute();
    expect(relationshipsAfter).toHaveLength(0);

    const artifactsAfter = await db.select().from(artifactsTable).where(eq(artifactsTable.id, artifact.id)).execute();
    expect(artifactsAfter).toHaveLength(0);

    const membersAfter = await db.select().from(projectMembersTable).where(eq(projectMembersTable.id, member.id)).execute();
    expect(membersAfter).toHaveLength(0);
  });

  it('should handle deletion of non-existent organization gracefully', async () => {
    // Try to delete organization with ID that doesn't exist
    await expect(deleteOrganization(999)).resolves.toBeUndefined();
  });

  it('should delete organization with no users or projects', async () => {
    // Create organization without any related entities
    const [organization] = await db.insert(organizationsTable)
      .values({
        name: 'Empty Organization',
        description: 'Organization with no users or projects'
      })
      .returning()
      .execute();

    // Delete organization
    await deleteOrganization(organization.id);

    // Verify organization is deleted
    const orgsAfter = await db.select()
      .from(organizationsTable)
      .where(eq(organizationsTable.id, organization.id))
      .execute();
    expect(orgsAfter).toHaveLength(0);
  });
});

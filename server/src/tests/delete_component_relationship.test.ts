
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { organizationsTable, usersTable, projectsTable, componentsTable, componentRelationshipsTable } from '../db/schema';
import { type CreateComponentRelationshipInput } from '../schema';
import { deleteComponentRelationship } from '../handlers/delete_component_relationship';
import { eq } from 'drizzle-orm';

describe('deleteComponentRelationship', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing component relationship', async () => {
    // Create prerequisite data
    const organization = await db.insert(organizationsTable)
      .values({ name: 'Test Org', description: 'Test organization' })
      .returning()
      .execute();

    const user = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        role: 'member',
        organization_id: organization[0].id
      })
      .returning()
      .execute();

    const project = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        description: 'Test project',
        organization_id: organization[0].id,
        created_by: user[0].id,
        status: 'active'
      })
      .returning()
      .execute();

    const sourceComponent = await db.insert(componentsTable)
      .values({
        name: 'Source Component',
        description: 'Source component for testing',
        type: 'application',
        layer: 'application',
        project_id: project[0].id,
        created_by: user[0].id,
        metadata: null
      })
      .returning()
      .execute();

    const targetComponent = await db.insert(componentsTable)
      .values({
        name: 'Target Component',
        description: 'Target component for testing',
        type: 'service',
        layer: 'application',
        project_id: project[0].id,
        created_by: user[0].id,
        metadata: null
      })
      .returning()
      .execute();

    // Create component relationship
    const relationship = await db.insert(componentRelationshipsTable)
      .values({
        source_component_id: sourceComponent[0].id,
        target_component_id: targetComponent[0].id,
        relationship_type: 'depends_on',
        description: 'Test relationship',
        created_by: user[0].id
      })
      .returning()
      .execute();

    // Delete the relationship
    await deleteComponentRelationship(relationship[0].id);

    // Verify relationship was deleted
    const relationships = await db.select()
      .from(componentRelationshipsTable)
      .where(eq(componentRelationshipsTable.id, relationship[0].id))
      .execute();

    expect(relationships).toHaveLength(0);
  });

  it('should succeed even when relationship does not exist', async () => {
    // Should not throw error when deleting non-existent relationship
    await expect(deleteComponentRelationship(999)).resolves.toBeUndefined();
  });

  it('should not affect other relationships when deleting one', async () => {
    // Create prerequisite data
    const organization = await db.insert(organizationsTable)
      .values({ name: 'Test Org', description: 'Test organization' })
      .returning()
      .execute();

    const user = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        role: 'member',
        organization_id: organization[0].id
      })
      .returning()
      .execute();

    const project = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        description: 'Test project',
        organization_id: organization[0].id,
        created_by: user[0].id,
        status: 'active'
      })
      .returning()
      .execute();

    const component1 = await db.insert(componentsTable)
      .values({
        name: 'Component 1',
        description: 'First component',
        type: 'application',
        layer: 'application',
        project_id: project[0].id,
        created_by: user[0].id,
        metadata: null
      })
      .returning()
      .execute();

    const component2 = await db.insert(componentsTable)
      .values({
        name: 'Component 2',
        description: 'Second component',
        type: 'service',
        layer: 'application',
        project_id: project[0].id,
        created_by: user[0].id,
        metadata: null
      })
      .returning()
      .execute();

    const component3 = await db.insert(componentsTable)
      .values({
        name: 'Component 3',
        description: 'Third component',
        type: 'data_entity',
        layer: 'data',
        project_id: project[0].id,
        created_by: user[0].id,
        metadata: null
      })
      .returning()
      .execute();

    // Create multiple relationships
    const relationship1 = await db.insert(componentRelationshipsTable)
      .values({
        source_component_id: component1[0].id,
        target_component_id: component2[0].id,
        relationship_type: 'depends_on',
        description: 'First relationship',
        created_by: user[0].id
      })
      .returning()
      .execute();

    const relationship2 = await db.insert(componentRelationshipsTable)
      .values({
        source_component_id: component2[0].id,
        target_component_id: component3[0].id,
        relationship_type: 'uses',
        description: 'Second relationship',
        created_by: user[0].id
      })
      .returning()
      .execute();

    // Delete first relationship
    await deleteComponentRelationship(relationship1[0].id);

    // Verify only first relationship was deleted
    const allRelationships = await db.select()
      .from(componentRelationshipsTable)
      .execute();

    expect(allRelationships).toHaveLength(1);
    expect(allRelationships[0].id).toEqual(relationship2[0].id);
    expect(allRelationships[0].description).toEqual('Second relationship');
  });
});

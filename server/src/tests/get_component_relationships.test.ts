
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { organizationsTable, usersTable, projectsTable, componentsTable, componentRelationshipsTable } from '../db/schema';
import { type CreateComponentRelationshipInput } from '../schema';
import { getComponentRelationships } from '../handlers/get_component_relationships';

describe('getComponentRelationships', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no relationships exist', async () => {
    const result = await getComponentRelationships();
    
    expect(result).toEqual([]);
  });

  it('should fetch all component relationships', async () => {
    // Create prerequisite data
    const org = await db.insert(organizationsTable)
      .values({ name: 'Test Org', description: 'Test organization' })
      .returning()
      .execute();

    const user = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
        organization_id: org[0].id
      })
      .returning()
      .execute();

    const project = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        description: 'Test project',
        organization_id: org[0].id,
        created_by: user[0].id
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
        created_by: user[0].id
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
        created_by: user[0].id
      })
      .returning()
      .execute();

    // Create test relationships
    const relationship1 = await db.insert(componentRelationshipsTable)
      .values({
        source_component_id: sourceComponent[0].id,
        target_component_id: targetComponent[0].id,
        relationship_type: 'depends_on',
        description: 'First test relationship',
        created_by: user[0].id
      })
      .returning()
      .execute();

    const relationship2 = await db.insert(componentRelationshipsTable)
      .values({
        source_component_id: targetComponent[0].id,
        target_component_id: sourceComponent[0].id,
        relationship_type: 'supports',
        description: 'Second test relationship',
        created_by: user[0].id
      })
      .returning()
      .execute();

    const result = await getComponentRelationships();

    expect(result).toHaveLength(2);
    
    // Check first relationship
    const rel1 = result.find(r => r.id === relationship1[0].id);
    expect(rel1).toBeDefined();
    expect(rel1!.source_component_id).toEqual(sourceComponent[0].id);
    expect(rel1!.target_component_id).toEqual(targetComponent[0].id);
    expect(rel1!.relationship_type).toEqual('depends_on');
    expect(rel1!.description).toEqual('First test relationship');
    expect(rel1!.created_by).toEqual(user[0].id);
    expect(rel1!.created_at).toBeInstanceOf(Date);

    // Check second relationship
    const rel2 = result.find(r => r.id === relationship2[0].id);
    expect(rel2).toBeDefined();
    expect(rel2!.source_component_id).toEqual(targetComponent[0].id);
    expect(rel2!.target_component_id).toEqual(sourceComponent[0].id);
    expect(rel2!.relationship_type).toEqual('supports');
    expect(rel2!.description).toEqual('Second test relationship');
    expect(rel2!.created_by).toEqual(user[0].id);
    expect(rel2!.created_at).toBeInstanceOf(Date);
  });

  it('should handle relationships with null descriptions', async () => {
    // Create prerequisite data
    const org = await db.insert(organizationsTable)
      .values({ name: 'Test Org', description: 'Test organization' })
      .returning()
      .execute();

    const user = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
        organization_id: org[0].id
      })
      .returning()
      .execute();

    const project = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        description: 'Test project',
        organization_id: org[0].id,
        created_by: user[0].id
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
        created_by: user[0].id
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
        created_by: user[0].id
      })
      .returning()
      .execute();

    // Create relationship with null description
    await db.insert(componentRelationshipsTable)
      .values({
        source_component_id: sourceComponent[0].id,
        target_component_id: targetComponent[0].id,
        relationship_type: 'uses',
        description: null,
        created_by: user[0].id
      })
      .returning()
      .execute();

    const result = await getComponentRelationships();

    expect(result).toHaveLength(1);
    expect(result[0].description).toBeNull();
    expect(result[0].relationship_type).toEqual('uses');
  });
});

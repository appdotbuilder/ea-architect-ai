
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { organizationsTable, usersTable, projectsTable, componentsTable, componentRelationshipsTable } from '../db/schema';
import { type CreateComponentRelationshipInput } from '../schema';
import { createComponentRelationship } from '../handlers/create_component_relationship';
import { eq } from 'drizzle-orm';

describe('createComponentRelationship', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let organizationId: number;
  let userId: number;
  let projectId: number;
  let sourceComponentId: number;
  let targetComponentId: number;

  beforeEach(async () => {
    // Create prerequisite data
    const organization = await db.insert(organizationsTable)
      .values({
        name: 'Test Organization',
        description: 'Test organization for relationships'
      })
      .returning()
      .execute();
    organizationId = organization[0].id;

    const user = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
        organization_id: organizationId
      })
      .returning()
      .execute();
    userId = user[0].id;

    const project = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        description: 'Test project for relationships',
        organization_id: organizationId,
        created_by: userId
      })
      .returning()
      .execute();
    projectId = project[0].id;

    const sourceComponent = await db.insert(componentsTable)
      .values({
        name: 'Source Component',
        description: 'Source component for testing',
        type: 'application',
        layer: 'application',
        project_id: projectId,
        created_by: userId
      })
      .returning()
      .execute();
    sourceComponentId = sourceComponent[0].id;

    const targetComponent = await db.insert(componentsTable)
      .values({
        name: 'Target Component',
        description: 'Target component for testing',
        type: 'service',
        layer: 'application',
        project_id: projectId,
        created_by: userId
      })
      .returning()
      .execute();
    targetComponentId = targetComponent[0].id;
  });

  it('should create a component relationship', async () => {
    const testInput: CreateComponentRelationshipInput = {
      source_component_id: sourceComponentId,
      target_component_id: targetComponentId,
      relationship_type: 'depends_on',
      description: 'Source component depends on target component',
      created_by: userId
    };

    const result = await createComponentRelationship(testInput);

    expect(result.source_component_id).toEqual(sourceComponentId);
    expect(result.target_component_id).toEqual(targetComponentId);
    expect(result.relationship_type).toEqual('depends_on');
    expect(result.description).toEqual('Source component depends on target component');
    expect(result.created_by).toEqual(userId);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save relationship to database', async () => {
    const testInput: CreateComponentRelationshipInput = {
      source_component_id: sourceComponentId,
      target_component_id: targetComponentId,
      relationship_type: 'uses',
      created_by: userId
    };

    const result = await createComponentRelationship(testInput);

    const relationships = await db.select()
      .from(componentRelationshipsTable)
      .where(eq(componentRelationshipsTable.id, result.id))
      .execute();

    expect(relationships).toHaveLength(1);
    expect(relationships[0].source_component_id).toEqual(sourceComponentId);
    expect(relationships[0].target_component_id).toEqual(targetComponentId);
    expect(relationships[0].relationship_type).toEqual('uses');
    expect(relationships[0].description).toBeNull();
    expect(relationships[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle optional description field', async () => {
    const testInputWithoutDescription: CreateComponentRelationshipInput = {
      source_component_id: sourceComponentId,
      target_component_id: targetComponentId,
      relationship_type: 'supports',
      created_by: userId
    };

    const result = await createComponentRelationship(testInputWithoutDescription);

    expect(result.description).toBeNull();
  });

  it('should fail when source component does not exist', async () => {
    const testInput: CreateComponentRelationshipInput = {
      source_component_id: 99999,
      target_component_id: targetComponentId,
      relationship_type: 'depends_on',
      created_by: userId
    };

    expect(createComponentRelationship(testInput))
      .rejects.toThrow(/source component.*not found/i);
  });

  it('should fail when target component does not exist', async () => {
    const testInput: CreateComponentRelationshipInput = {
      source_component_id: sourceComponentId,
      target_component_id: 99999,
      relationship_type: 'depends_on',
      created_by: userId
    };

    expect(createComponentRelationship(testInput))
      .rejects.toThrow(/target component.*not found/i);
  });

  it('should fail when components belong to different projects', async () => {
    // Create another project
    const anotherProject = await db.insert(projectsTable)
      .values({
        name: 'Another Project',
        organization_id: organizationId,
        created_by: userId
      })
      .returning()
      .execute();

    // Create component in different project
    const differentProjectComponent = await db.insert(componentsTable)
      .values({
        name: 'Different Project Component',
        type: 'application',
        layer: 'application',
        project_id: anotherProject[0].id,
        created_by: userId
      })
      .returning()
      .execute();

    const testInput: CreateComponentRelationshipInput = {
      source_component_id: sourceComponentId,
      target_component_id: differentProjectComponent[0].id,
      relationship_type: 'depends_on',
      created_by: userId
    };

    expect(createComponentRelationship(testInput))
      .rejects.toThrow(/same project/i);
  });

  it('should fail when creating self-relationship', async () => {
    const testInput: CreateComponentRelationshipInput = {
      source_component_id: sourceComponentId,
      target_component_id: sourceComponentId,
      relationship_type: 'depends_on',
      created_by: userId
    };

    expect(createComponentRelationship(testInput))
      .rejects.toThrow(/cannot create relationship from component to itself/i);
  });
});

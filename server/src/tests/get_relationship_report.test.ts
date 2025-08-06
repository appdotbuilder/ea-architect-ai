
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { 
  organizationsTable, 
  usersTable, 
  projectsTable, 
  componentsTable,
  componentRelationshipsTable 
} from '../db/schema';
import { getRelationshipReport } from '../handlers/get_relationship_report';

describe('getRelationshipReport', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let orgId: number;
  let userId: number;
  let projectId: number;
  let component1Id: number;
  let component2Id: number;
  let component3Id: number;

  beforeEach(async () => {
    // Create organization
    const org = await db.insert(organizationsTable)
      .values({
        name: 'Test Organization',
        description: 'Test org for relationship reports'
      })
      .returning()
      .execute();
    orgId = org[0].id;

    // Create user
    const user = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
        organization_id: orgId
      })
      .returning()
      .execute();
    userId = user[0].id;

    // Create project
    const project = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        description: 'Project for relationship testing',
        organization_id: orgId,
        created_by: userId,
        status: 'active'
      })
      .returning()
      .execute();
    projectId = project[0].id;

    // Create components
    const component1 = await db.insert(componentsTable)
      .values({
        name: 'App Component',
        description: 'An application',
        type: 'application',
        layer: 'application',
        project_id: projectId,
        created_by: userId
      })
      .returning()
      .execute();
    component1Id = component1[0].id;

    const component2 = await db.insert(componentsTable)
      .values({
        name: 'Service Component',
        description: 'A service',
        type: 'service',
        layer: 'application',
        project_id: projectId,
        created_by: userId
      })
      .returning()
      .execute();
    component2Id = component2[0].id;

    const component3 = await db.insert(componentsTable)
      .values({
        name: 'Data Component',
        description: 'A data entity',
        type: 'data_entity',
        layer: 'data',
        project_id: projectId,
        created_by: userId
      })
      .returning()
      .execute();
    component3Id = component3[0].id;
  });

  it('should return empty report for project with no relationships', async () => {
    const result = await getRelationshipReport(projectId);

    expect(result.relationships).toHaveLength(0);
    expect(result.summary.total).toEqual(0);
    expect(result.summary.by_type).toEqual({});
  });

  it('should return relationships for project with multiple relationships', async () => {
    // Create relationships
    await db.insert(componentRelationshipsTable)
      .values([
        {
          source_component_id: component1Id,
          target_component_id: component2Id,
          relationship_type: 'uses',
          description: 'App uses service',
          created_by: userId
        },
        {
          source_component_id: component2Id,
          target_component_id: component3Id,
          relationship_type: 'depends_on',
          description: 'Service depends on data',
          created_by: userId
        },
        {
          source_component_id: component1Id,
          target_component_id: component3Id,
          relationship_type: 'uses',
          description: 'App uses data',
          created_by: userId
        }
      ])
      .execute();

    const result = await getRelationshipReport(projectId);

    expect(result.relationships).toHaveLength(3);
    expect(result.summary.total).toEqual(3);
    expect(result.summary.by_type).toEqual({
      'uses': 2,
      'depends_on': 1
    });

    // Verify relationship details
    const usesRelationships = result.relationships.filter(r => r.relationship_type === 'uses');
    expect(usesRelationships).toHaveLength(2);

    const dependsOnRelationships = result.relationships.filter(r => r.relationship_type === 'depends_on');
    expect(dependsOnRelationships).toHaveLength(1);
    expect(dependsOnRelationships[0].description).toEqual('Service depends on data');
  });

  it('should only include relationships within the specified project', async () => {
    // Create another project with components
    const otherProject = await db.insert(projectsTable)
      .values({
        name: 'Other Project',
        description: 'Another project',
        organization_id: orgId,
        created_by: userId,
        status: 'active'
      })
      .returning()
      .execute();
    const otherProjectId = otherProject[0].id;

    const otherComponent = await db.insert(componentsTable)
      .values({
        name: 'Other Component',
        description: 'Component in other project',
        type: 'application',
        layer: 'application',
        project_id: otherProjectId,
        created_by: userId
      })
      .returning()
      .execute();
    const otherComponentId = otherComponent[0].id;

    // Create relationships - one within project, one cross-project
    await db.insert(componentRelationshipsTable)
      .values([
        {
          source_component_id: component1Id,
          target_component_id: component2Id,
          relationship_type: 'uses',
          description: 'Within project',
          created_by: userId
        },
        {
          source_component_id: component1Id,
          target_component_id: otherComponentId,
          relationship_type: 'supports',
          description: 'Cross project',
          created_by: userId
        }
      ])
      .execute();

    const result = await getRelationshipReport(projectId);

    // Should only include the within-project relationship
    expect(result.relationships).toHaveLength(1);
    expect(result.relationships[0].description).toEqual('Within project');
    expect(result.summary.total).toEqual(1);
    expect(result.summary.by_type).toEqual({
      'uses': 1
    });
  });

  it('should handle all relationship types correctly', async () => {
    // Create relationships with different types
    await db.insert(componentRelationshipsTable)
      .values([
        {
          source_component_id: component1Id,
          target_component_id: component2Id,
          relationship_type: 'depends_on',
          created_by: userId
        },
        {
          source_component_id: component2Id,
          target_component_id: component3Id,
          relationship_type: 'supports',
          created_by: userId
        },
        {
          source_component_id: component1Id,
          target_component_id: component3Id,
          relationship_type: 'implements',
          created_by: userId
        },
        {
          source_component_id: component2Id,
          target_component_id: component1Id,
          relationship_type: 'flows_to',
          created_by: userId
        }
      ])
      .execute();

    const result = await getRelationshipReport(projectId);

    expect(result.summary.total).toEqual(4);
    expect(result.summary.by_type).toEqual({
      'depends_on': 1,
      'supports': 1,
      'implements': 1,
      'flows_to': 1
    });
  });
});

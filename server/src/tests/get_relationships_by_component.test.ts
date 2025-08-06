
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
import { getRelationshipsByComponent } from '../handlers/get_relationships_by_component';

// Test data
const testOrganization = {
  name: 'Test Organization',
  description: 'An organization for testing'
};

const testUser = {
  email: 'test@example.com',
  name: 'Test User',
  role: 'admin' as const,
  organization_id: 1
};

const testProject = {
  name: 'Test Project',
  description: 'A project for testing',
  organization_id: 1,
  created_by: 1
};

const testComponents = [
  {
    name: 'Component A',
    description: 'First test component',
    type: 'application' as const,
    layer: 'application' as const,
    project_id: 1,
    created_by: 1,
    metadata: null
  },
  {
    name: 'Component B',
    description: 'Second test component',
    type: 'service' as const,
    layer: 'application' as const,
    project_id: 1,
    created_by: 1,
    metadata: null
  },
  {
    name: 'Component C',
    description: 'Third test component',
    type: 'data_entity' as const,
    layer: 'data' as const,
    project_id: 1,
    created_by: 1,
    metadata: null
  }
];

describe('getRelationshipsByComponent', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no relationships exist', async () => {
    // Create prerequisite data
    await db.insert(organizationsTable).values(testOrganization).execute();
    await db.insert(usersTable).values(testUser).execute();
    await db.insert(projectsTable).values(testProject).execute();
    await db.insert(componentsTable).values(testComponents[0]).execute();

    const result = await getRelationshipsByComponent(1);

    expect(result).toEqual([]);
  });

  it('should return relationships where component is the source', async () => {
    // Create prerequisite data
    await db.insert(organizationsTable).values(testOrganization).execute();
    await db.insert(usersTable).values(testUser).execute();
    await db.insert(projectsTable).values(testProject).execute();
    await db.insert(componentsTable).values(testComponents).execute();

    // Create relationships where component 1 is the source
    const testRelationship = {
      source_component_id: 1,
      target_component_id: 2,
      relationship_type: 'depends_on' as const,
      description: 'Component A depends on Component B',
      created_by: 1
    };

    await db.insert(componentRelationshipsTable).values(testRelationship).execute();

    const result = await getRelationshipsByComponent(1);

    expect(result).toHaveLength(1);
    expect(result[0].source_component_id).toEqual(1);
    expect(result[0].target_component_id).toEqual(2);
    expect(result[0].relationship_type).toEqual('depends_on');
    expect(result[0].description).toEqual('Component A depends on Component B');
    expect(result[0].created_by).toEqual(1);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should return relationships where component is the target', async () => {
    // Create prerequisite data
    await db.insert(organizationsTable).values(testOrganization).execute();
    await db.insert(usersTable).values(testUser).execute();
    await db.insert(projectsTable).values(testProject).execute();
    await db.insert(componentsTable).values(testComponents).execute();

    // Create relationships where component 1 is the target
    const testRelationship = {
      source_component_id: 2,
      target_component_id: 1,
      relationship_type: 'supports' as const,
      description: 'Component B supports Component A',
      created_by: 1
    };

    await db.insert(componentRelationshipsTable).values(testRelationship).execute();

    const result = await getRelationshipsByComponent(1);

    expect(result).toHaveLength(1);
    expect(result[0].source_component_id).toEqual(2);
    expect(result[0].target_component_id).toEqual(1);
    expect(result[0].relationship_type).toEqual('supports');
    expect(result[0].description).toEqual('Component B supports Component A');
  });

  it('should return all relationships where component is either source or target', async () => {
    // Create prerequisite data
    await db.insert(organizationsTable).values(testOrganization).execute();
    await db.insert(usersTable).values(testUser).execute();
    await db.insert(projectsTable).values(testProject).execute();
    await db.insert(componentsTable).values(testComponents).execute();

    // Create multiple relationships involving component 1
    const testRelationships = [
      {
        source_component_id: 1,
        target_component_id: 2,
        relationship_type: 'depends_on' as const,
        description: 'Component A depends on Component B',
        created_by: 1
      },
      {
        source_component_id: 3,
        target_component_id: 1,
        relationship_type: 'flows_to' as const,
        description: 'Component C flows to Component A',
        created_by: 1
      },
      {
        source_component_id: 2,
        target_component_id: 3,
        relationship_type: 'uses' as const,
        description: 'Component B uses Component C (should not be included)',
        created_by: 1
      }
    ];

    await db.insert(componentRelationshipsTable).values(testRelationships).execute();

    const result = await getRelationshipsByComponent(1);

    expect(result).toHaveLength(2);
    
    // Find the relationship where component 1 is source
    const asSource = result.find(r => r.source_component_id === 1);
    expect(asSource).toBeDefined();
    expect(asSource!.target_component_id).toEqual(2);
    expect(asSource!.relationship_type).toEqual('depends_on');

    // Find the relationship where component 1 is target
    const asTarget = result.find(r => r.target_component_id === 1);
    expect(asTarget).toBeDefined();
    expect(asTarget!.source_component_id).toEqual(3);
    expect(asTarget!.relationship_type).toEqual('flows_to');
  });

  it('should not return relationships for other components', async () => {
    // Create prerequisite data
    await db.insert(organizationsTable).values(testOrganization).execute();
    await db.insert(usersTable).values(testUser).execute();
    await db.insert(projectsTable).values(testProject).execute();
    await db.insert(componentsTable).values(testComponents).execute();

    // Create relationship between components 2 and 3 (not involving component 1)
    const testRelationship = {
      source_component_id: 2,
      target_component_id: 3,
      relationship_type: 'implements' as const,
      description: 'Component B implements Component C',
      created_by: 1
    };

    await db.insert(componentRelationshipsTable).values(testRelationship).execute();

    const result = await getRelationshipsByComponent(1);

    expect(result).toHaveLength(0);
  });
});

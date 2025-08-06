
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { componentsTable, usersTable, organizationsTable, projectsTable } from '../db/schema';
import { type CreateComponentInput } from '../schema';
import { getComponents } from '../handlers/get_components';

describe('getComponents', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no components exist', async () => {
    const result = await getComponents();
    expect(result).toEqual([]);
  });

  it('should return all components', async () => {
    // Create prerequisite data
    const org = await db.insert(organizationsTable)
      .values({
        name: 'Test Organization',
        description: 'Test org'
      })
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

    // Create test components
    const component1 = await db.insert(componentsTable)
      .values({
        name: 'Component 1',
        description: 'First test component',
        type: 'business_process',
        layer: 'business',
        project_id: project[0].id,
        created_by: user[0].id,
        metadata: '{"key": "value1"}'
      })
      .returning()
      .execute();

    const component2 = await db.insert(componentsTable)
      .values({
        name: 'Component 2',
        description: 'Second test component',
        type: 'application',
        layer: 'application',
        project_id: project[0].id,
        created_by: user[0].id,
        metadata: null
      })
      .returning()
      .execute();

    const result = await getComponents();

    expect(result).toHaveLength(2);
    
    // Verify first component
    const resultComponent1 = result.find(c => c.name === 'Component 1');
    expect(resultComponent1).toBeDefined();
    expect(resultComponent1!.name).toEqual('Component 1');
    expect(resultComponent1!.description).toEqual('First test component');
    expect(resultComponent1!.type).toEqual('business_process');
    expect(resultComponent1!.layer).toEqual('business');
    expect(resultComponent1!.project_id).toEqual(project[0].id);
    expect(resultComponent1!.created_by).toEqual(user[0].id);
    expect(resultComponent1!.metadata).toEqual('{"key": "value1"}');
    expect(resultComponent1!.id).toBeDefined();
    expect(resultComponent1!.created_at).toBeInstanceOf(Date);
    expect(resultComponent1!.updated_at).toBeInstanceOf(Date);

    // Verify second component
    const resultComponent2 = result.find(c => c.name === 'Component 2');
    expect(resultComponent2).toBeDefined();
    expect(resultComponent2!.name).toEqual('Component 2');
    expect(resultComponent2!.description).toEqual('Second test component');
    expect(resultComponent2!.type).toEqual('application');
    expect(resultComponent2!.layer).toEqual('application');
    expect(resultComponent2!.project_id).toEqual(project[0].id);
    expect(resultComponent2!.created_by).toEqual(user[0].id);
    expect(resultComponent2!.metadata).toBeNull();
    expect(resultComponent2!.id).toBeDefined();
    expect(resultComponent2!.created_at).toBeInstanceOf(Date);
    expect(resultComponent2!.updated_at).toBeInstanceOf(Date);
  });

  it('should return components with different types and layers', async () => {
    // Create prerequisite data
    const org = await db.insert(organizationsTable)
      .values({
        name: 'Test Organization',
        description: 'Test org'
      })
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

    // Create components with different types and layers
    await db.insert(componentsTable)
      .values([
        {
          name: 'Business Process',
          description: 'A business process',
          type: 'business_process',
          layer: 'business',
          project_id: project[0].id,
          created_by: user[0].id
        },
        {
          name: 'Data Entity',
          description: 'A data entity',
          type: 'data_entity',
          layer: 'data',
          project_id: project[0].id,
          created_by: user[0].id
        },
        {
          name: 'Application Service',
          description: 'An application service',
          type: 'service',
          layer: 'application',
          project_id: project[0].id,
          created_by: user[0].id
        },
        {
          name: 'Infrastructure Component',
          description: 'An infrastructure component',
          type: 'infrastructure_component',
          layer: 'technology',
          project_id: project[0].id,
          created_by: user[0].id
        }
      ])
      .execute();

    const result = await getComponents();

    expect(result).toHaveLength(4);
    
    // Verify we have all different types and layers
    const types = result.map(c => c.type);
    const layers = result.map(c => c.layer);
    
    expect(types).toContain('business_process');
    expect(types).toContain('data_entity');
    expect(types).toContain('service');
    expect(types).toContain('infrastructure_component');
    
    expect(layers).toContain('business');
    expect(layers).toContain('data');
    expect(layers).toContain('application');
    expect(layers).toContain('technology');
  });
});

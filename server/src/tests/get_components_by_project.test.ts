
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { organizationsTable, usersTable, projectsTable, componentsTable } from '../db/schema';
import { getComponentsByProject } from '../handlers/get_components_by_project';

describe('getComponentsByProject', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return components for a specific project', async () => {
    // Create prerequisite data
    const [organization] = await db.insert(organizationsTable)
      .values({ name: 'Test Org', description: 'Test organization' })
      .returning();

    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
        organization_id: organization.id
      })
      .returning();

    const [project] = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        description: 'Test project',
        organization_id: organization.id,
        created_by: user.id
      })
      .returning();

    // Create components for the project
    const [component1, component2] = await db.insert(componentsTable)
      .values([
        {
          name: 'Component 1',
          description: 'First component',
          type: 'application',
          layer: 'application',
          project_id: project.id,
          created_by: user.id,
          metadata: null
        },
        {
          name: 'Component 2',
          description: 'Second component',
          type: 'business_process',
          layer: 'business',
          project_id: project.id,
          created_by: user.id,
          metadata: '{"priority": "high"}'
        }
      ])
      .returning();

    // Create another project with a component to ensure filtering works
    const [otherProject] = await db.insert(projectsTable)
      .values({
        name: 'Other Project',
        description: 'Other project',
        organization_id: organization.id,
        created_by: user.id
      })
      .returning();

    await db.insert(componentsTable)
      .values({
        name: 'Other Component',
        description: 'Component in other project',
        type: 'service',
        layer: 'application',
        project_id: otherProject.id,
        created_by: user.id,
        metadata: null
      });

    const result = await getComponentsByProject(project.id);

    expect(result).toHaveLength(2);
    
    const component1Result = result.find(c => c.name === 'Component 1');
    expect(component1Result).toBeDefined();
    expect(component1Result!.description).toEqual('First component');
    expect(component1Result!.type).toEqual('application');
    expect(component1Result!.layer).toEqual('application');
    expect(component1Result!.project_id).toEqual(project.id);
    expect(component1Result!.created_by).toEqual(user.id);
    expect(component1Result!.metadata).toBeNull();
    expect(component1Result!.id).toBeDefined();
    expect(component1Result!.created_at).toBeInstanceOf(Date);
    expect(component1Result!.updated_at).toBeInstanceOf(Date);

    const component2Result = result.find(c => c.name === 'Component 2');
    expect(component2Result).toBeDefined();
    expect(component2Result!.description).toEqual('Second component');
    expect(component2Result!.type).toEqual('business_process');
    expect(component2Result!.layer).toEqual('business');
    expect(component2Result!.metadata).toEqual('{"priority": "high"}');

    // Verify only components from the specified project are returned
    expect(result.every(c => c.project_id === project.id)).toBe(true);
  });

  it('should return empty array for project with no components', async () => {
    // Create prerequisite data
    const [organization] = await db.insert(organizationsTable)
      .values({ name: 'Test Org', description: 'Test organization' })
      .returning();

    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
        organization_id: organization.id
      })
      .returning();

    const [project] = await db.insert(projectsTable)
      .values({
        name: 'Empty Project',
        description: 'Project with no components',
        organization_id: organization.id,
        created_by: user.id
      })
      .returning();

    const result = await getComponentsByProject(project.id);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return empty array for non-existent project', async () => {
    const result = await getComponentsByProject(99999);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should handle multiple component types and layers', async () => {
    // Create prerequisite data
    const [organization] = await db.insert(organizationsTable)
      .values({ name: 'Test Org', description: 'Test organization' })
      .returning();

    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
        organization_id: organization.id
      })
      .returning();

    const [project] = await db.insert(projectsTable)
      .values({
        name: 'Multi-Component Project',
        description: 'Project with various component types',
        organization_id: organization.id,
        created_by: user.id
      })
      .returning();

    // Create components of different types and layers
    await db.insert(componentsTable)
      .values([
        {
          name: 'Business Process',
          description: 'A business process',
          type: 'business_process',
          layer: 'business',
          project_id: project.id,
          created_by: user.id,
          metadata: null
        },
        {
          name: 'Data Entity',
          description: 'A data entity',
          type: 'data_entity',
          layer: 'data',
          project_id: project.id,
          created_by: user.id,
          metadata: null
        },
        {
          name: 'Application Service',
          description: 'An application service',
          type: 'service',
          layer: 'application',
          project_id: project.id,
          created_by: user.id,
          metadata: null
        },
        {
          name: 'Infrastructure Component',
          description: 'Infrastructure component',
          type: 'infrastructure_component',
          layer: 'technology',
          project_id: project.id,
          created_by: user.id,
          metadata: null
        }
      ]);

    const result = await getComponentsByProject(project.id);

    expect(result).toHaveLength(4);

    // Verify we have components from all layers
    const layers = result.map(c => c.layer);
    expect(layers).toContain('business');
    expect(layers).toContain('data');
    expect(layers).toContain('application');
    expect(layers).toContain('technology');

    // Verify we have different component types
    const types = result.map(c => c.type);
    expect(types).toContain('business_process');
    expect(types).toContain('data_entity');
    expect(types).toContain('service');
    expect(types).toContain('infrastructure_component');
  });
});

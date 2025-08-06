
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { organizationsTable, usersTable, projectsTable, componentsTable } from '../db/schema';
import { type CreateOrganizationInput, type CreateUserInput, type CreateProjectInput, type CreateComponentInput } from '../schema';
import { getComponentsByLayer } from '../handlers/get_components_by_layer';

describe('getComponentsByLayer', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let organizationId: number;
  let userId: number;
  let projectId: number;

  beforeEach(async () => {
    // Create organization
    const orgInput: CreateOrganizationInput = {
      name: 'Test Organization',
      description: 'A test organization'
    };
    const orgResult = await db.insert(organizationsTable)
      .values(orgInput)
      .returning()
      .execute();
    organizationId = orgResult[0].id;

    // Create user
    const userInput: CreateUserInput = {
      email: 'test@example.com',
      name: 'Test User',
      role: 'member',
      organization_id: organizationId
    };
    const userResult = await db.insert(usersTable)
      .values(userInput)
      .returning()
      .execute();
    userId = userResult[0].id;

    // Create project
    const projectInput: CreateProjectInput = {
      name: 'Test Project',
      description: 'A test project',
      organization_id: organizationId,
      created_by: userId
    };
    const projectResult = await db.insert(projectsTable)
      .values(projectInput)
      .returning()
      .execute();
    projectId = projectResult[0].id;
  });

  it('should return components for specified layer', async () => {
    // Create components in different layers
    const businessComponent: CreateComponentInput = {
      name: 'Business Process 1',
      description: 'A business process',
      type: 'business_process',
      layer: 'business',
      project_id: projectId,
      created_by: userId,
      metadata: null
    };

    const dataComponent: CreateComponentInput = {
      name: 'Data Entity 1',
      description: 'A data entity',
      type: 'data_entity',
      layer: 'data',
      project_id: projectId,
      created_by: userId,
      metadata: null
    };

    const applicationComponent: CreateComponentInput = {
      name: 'Application 1',
      description: 'An application',
      type: 'application',
      layer: 'application',
      project_id: projectId,
      created_by: userId,
      metadata: null
    };

    // Insert components
    await db.insert(componentsTable)
      .values([businessComponent, dataComponent, applicationComponent])
      .execute();

    // Test getting business layer components
    const businessComponents = await getComponentsByLayer(projectId, 'business');

    expect(businessComponents).toHaveLength(1);
    expect(businessComponents[0].name).toEqual('Business Process 1');
    expect(businessComponents[0].layer).toEqual('business');
    expect(businessComponents[0].type).toEqual('business_process');
    expect(businessComponents[0].project_id).toEqual(projectId);
    expect(businessComponents[0].created_by).toEqual(userId);
    expect(businessComponents[0].created_at).toBeInstanceOf(Date);
    expect(businessComponents[0].updated_at).toBeInstanceOf(Date);

    // Test getting data layer components
    const dataComponents = await getComponentsByLayer(projectId, 'data');

    expect(dataComponents).toHaveLength(1);
    expect(dataComponents[0].name).toEqual('Data Entity 1');
    expect(dataComponents[0].layer).toEqual('data');
    expect(dataComponents[0].type).toEqual('data_entity');
  });

  it('should return empty array when no components exist for layer', async () => {
    // Don't create any components
    const components = await getComponentsByLayer(projectId, 'technology');

    expect(components).toHaveLength(0);
  });

  it('should filter by project and layer correctly', async () => {
    // Create another project
    const otherProjectInput: CreateProjectInput = {
      name: 'Other Project',
      description: 'Another project',
      organization_id: organizationId,
      created_by: userId
    };
    const otherProjectResult = await db.insert(projectsTable)
      .values(otherProjectInput)
      .returning()
      .execute();
    const otherProjectId = otherProjectResult[0].id;

    // Create components in both projects with same layer
    const component1: CreateComponentInput = {
      name: 'Component 1',
      description: 'Component in project 1',
      type: 'application',
      layer: 'application',
      project_id: projectId,
      created_by: userId,
      metadata: null
    };

    const component2: CreateComponentInput = {
      name: 'Component 2',
      description: 'Component in project 2',
      type: 'application',
      layer: 'application',
      project_id: otherProjectId,
      created_by: userId,
      metadata: null
    };

    const component3: CreateComponentInput = {
      name: 'Component 3',
      description: 'Component in project 1, different layer',
      type: 'data_entity',
      layer: 'data',
      project_id: projectId,
      created_by: userId,
      metadata: null
    };

    await db.insert(componentsTable)
      .values([component1, component2, component3])
      .execute();

    // Should only return application layer components from the specified project
    const components = await getComponentsByLayer(projectId, 'application');

    expect(components).toHaveLength(1);
    expect(components[0].name).toEqual('Component 1');
    expect(components[0].project_id).toEqual(projectId);
    expect(components[0].layer).toEqual('application');
  });

  it('should handle multiple components in same layer', async () => {
    // Create multiple components in the same layer
    const components: CreateComponentInput[] = [
      {
        name: 'Tech Component 1',
        description: 'First tech component',
        type: 'infrastructure_component',
        layer: 'technology',
        project_id: projectId,
        created_by: userId,
        metadata: null
      },
      {
        name: 'Tech Component 2',
        description: 'Second tech component',
        type: 'technology_standard',
        layer: 'technology',
        project_id: projectId,
        created_by: userId,
        metadata: null
      }
    ];

    await db.insert(componentsTable)
      .values(components)
      .execute();

    const result = await getComponentsByLayer(projectId, 'technology');

    expect(result).toHaveLength(2);
    
    // Sort by name for consistent testing
    const sortedResults = result.sort((a, b) => a.name.localeCompare(b.name));
    
    expect(sortedResults[0].name).toEqual('Tech Component 1');
    expect(sortedResults[0].type).toEqual('infrastructure_component');
    expect(sortedResults[1].name).toEqual('Tech Component 2');
    expect(sortedResults[1].type).toEqual('technology_standard');
    
    // All should be from same project and layer
    sortedResults.forEach(component => {
      expect(component.project_id).toEqual(projectId);
      expect(component.layer).toEqual('technology');
    });
  });
});


import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { organizationsTable, usersTable, projectsTable, componentsTable, componentRelationshipsTable } from '../db/schema';
import { getRelationshipsByProject } from '../handlers/get_relationships_by_project';

describe('getRelationshipsByProject', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all relationships for components in a project', async () => {
    // Create test data
    const org = await db.insert(organizationsTable).values({
      name: 'Test Org',
      description: 'Test organization'
    }).returning().execute();

    const user = await db.insert(usersTable).values({
      email: 'test@example.com',
      name: 'Test User',
      role: 'admin',
      organization_id: org[0].id
    }).returning().execute();

    const project = await db.insert(projectsTable).values({
      name: 'Test Project',
      description: 'Test project',
      organization_id: org[0].id,
      created_by: user[0].id
    }).returning().execute();

    // Create components
    const component1 = await db.insert(componentsTable).values({
      name: 'Component 1',
      description: 'First component',
      type: 'application',
      layer: 'application',
      project_id: project[0].id,
      created_by: user[0].id
    }).returning().execute();

    const component2 = await db.insert(componentsTable).values({
      name: 'Component 2',
      description: 'Second component',
      type: 'service',
      layer: 'application',
      project_id: project[0].id,
      created_by: user[0].id
    }).returning().execute();

    // Create relationship
    const relationship = await db.insert(componentRelationshipsTable).values({
      source_component_id: component1[0].id,
      target_component_id: component2[0].id,
      relationship_type: 'depends_on',
      description: 'Test relationship',
      created_by: user[0].id
    }).returning().execute();

    const results = await getRelationshipsByProject(project[0].id);

    expect(results).toHaveLength(1);
    expect(results[0].id).toEqual(relationship[0].id);
    expect(results[0].source_component_id).toEqual(component1[0].id);
    expect(results[0].target_component_id).toEqual(component2[0].id);
    expect(results[0].relationship_type).toEqual('depends_on');
    expect(results[0].description).toEqual('Test relationship');
    expect(results[0].created_by).toEqual(user[0].id);
    expect(results[0].created_at).toBeInstanceOf(Date);
  });

  it('should return empty array when project has no components', async () => {
    // Create test data without components
    const org = await db.insert(organizationsTable).values({
      name: 'Test Org',
      description: 'Test organization'
    }).returning().execute();

    const user = await db.insert(usersTable).values({
      email: 'test@example.com',
      name: 'Test User',
      role: 'admin',
      organization_id: org[0].id
    }).returning().execute();

    const project = await db.insert(projectsTable).values({
      name: 'Empty Project',
      description: 'Project with no components',
      organization_id: org[0].id,
      created_by: user[0].id
    }).returning().execute();

    const results = await getRelationshipsByProject(project[0].id);

    expect(results).toHaveLength(0);
  });

  it('should only return relationships for components in the specified project', async () => {
    // Create test data
    const org = await db.insert(organizationsTable).values({
      name: 'Test Org',
      description: 'Test organization'
    }).returning().execute();

    const user = await db.insert(usersTable).values({
      email: 'test@example.com',
      name: 'Test User',
      role: 'admin',
      organization_id: org[0].id
    }).returning().execute();

    // Create two projects
    const project1 = await db.insert(projectsTable).values({
      name: 'Project 1',
      description: 'First project',
      organization_id: org[0].id,
      created_by: user[0].id
    }).returning().execute();

    const project2 = await db.insert(projectsTable).values({
      name: 'Project 2',
      description: 'Second project',
      organization_id: org[0].id,
      created_by: user[0].id
    }).returning().execute();

    // Create components in each project
    const comp1_proj1 = await db.insert(componentsTable).values({
      name: 'Component 1 Project 1',
      description: 'Component in project 1',
      type: 'application',
      layer: 'application',
      project_id: project1[0].id,
      created_by: user[0].id
    }).returning().execute();

    const comp2_proj1 = await db.insert(componentsTable).values({
      name: 'Component 2 Project 1',
      description: 'Second component in project 1',
      type: 'service',
      layer: 'application',
      project_id: project1[0].id,
      created_by: user[0].id
    }).returning().execute();

    const comp1_proj2 = await db.insert(componentsTable).values({
      name: 'Component 1 Project 2',
      description: 'Component in project 2',
      type: 'application',
      layer: 'application',
      project_id: project2[0].id,
      created_by: user[0].id
    }).returning().execute();

    const comp2_proj2 = await db.insert(componentsTable).values({
      name: 'Component 2 Project 2',
      description: 'Second component in project 2',
      type: 'service',
      layer: 'application',
      project_id: project2[0].id,
      created_by: user[0].id
    }).returning().execute();

    // Create relationships in each project
    await db.insert(componentRelationshipsTable).values({
      source_component_id: comp1_proj1[0].id,
      target_component_id: comp2_proj1[0].id,
      relationship_type: 'depends_on',
      description: 'Relationship in project 1',
      created_by: user[0].id
    }).execute();

    await db.insert(componentRelationshipsTable).values({
      source_component_id: comp1_proj2[0].id,
      target_component_id: comp2_proj2[0].id,
      relationship_type: 'uses',
      description: 'Relationship in project 2',
      created_by: user[0].id
    }).execute();

    // Get relationships for project 1 only
    const results = await getRelationshipsByProject(project1[0].id);

    expect(results).toHaveLength(1);
    expect(results[0].description).toEqual('Relationship in project 1');
    expect(results[0].relationship_type).toEqual('depends_on');
    expect(results[0].source_component_id).toEqual(comp1_proj1[0].id);
    expect(results[0].target_component_id).toEqual(comp2_proj1[0].id);
  });

  it('should return multiple relationships for the same project', async () => {
    // Create test data
    const org = await db.insert(organizationsTable).values({
      name: 'Test Org',
      description: 'Test organization'
    }).returning().execute();

    const user = await db.insert(usersTable).values({
      email: 'test@example.com',
      name: 'Test User',
      role: 'admin',
      organization_id: org[0].id
    }).returning().execute();

    const project = await db.insert(projectsTable).values({
      name: 'Test Project',
      description: 'Test project',
      organization_id: org[0].id,
      created_by: user[0].id
    }).returning().execute();

    // Create three components
    const component1 = await db.insert(componentsTable).values({
      name: 'Component 1',
      description: 'First component',
      type: 'application',
      layer: 'application',
      project_id: project[0].id,
      created_by: user[0].id
    }).returning().execute();

    const component2 = await db.insert(componentsTable).values({
      name: 'Component 2',
      description: 'Second component',
      type: 'service',
      layer: 'application',
      project_id: project[0].id,
      created_by: user[0].id
    }).returning().execute();

    const component3 = await db.insert(componentsTable).values({
      name: 'Component 3',
      description: 'Third component',
      type: 'data_entity',
      layer: 'data',
      project_id: project[0].id,
      created_by: user[0].id
    }).returning().execute();

    // Create multiple relationships
    await db.insert(componentRelationshipsTable).values([
      {
        source_component_id: component1[0].id,
        target_component_id: component2[0].id,
        relationship_type: 'depends_on',
        description: 'First relationship',
        created_by: user[0].id
      },
      {
        source_component_id: component2[0].id,
        target_component_id: component3[0].id,
        relationship_type: 'uses',
        description: 'Second relationship',
        created_by: user[0].id
      }
    ]).execute();

    const results = await getRelationshipsByProject(project[0].id);

    expect(results).toHaveLength(2);
    
    // Sort by description to make assertions predictable
    results.sort((a, b) => (a.description || '').localeCompare(b.description || ''));
    
    expect(results[0].description).toEqual('First relationship');
    expect(results[0].relationship_type).toEqual('depends_on');
    expect(results[1].description).toEqual('Second relationship');
    expect(results[1].relationship_type).toEqual('uses');
  });
});

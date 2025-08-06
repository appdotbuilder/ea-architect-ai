
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { componentsTable, usersTable, organizationsTable, projectsTable } from '../db/schema';
import { type CreateComponentInput } from '../schema';
import { createComponent } from '../handlers/create_component';
import { eq } from 'drizzle-orm';

// Test input for component creation
const testInput: CreateComponentInput = {
  name: 'Customer Management System',
  description: 'Application for managing customer data',
  type: 'application',
  layer: 'application',
  project_id: 1,
  created_by: 1,
  metadata: '{"version": "1.0", "tech_stack": "Node.js"}'
};

describe('createComponent', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a component with all fields', async () => {
    // Create prerequisite records
    const orgResult = await db.insert(organizationsTable)
      .values({ name: 'Test Organization' })
      .returning()
      .execute();

    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        role: 'member',
        organization_id: orgResult[0].id
      })
      .returning()
      .execute();

    const projectResult = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        organization_id: orgResult[0].id,
        created_by: userResult[0].id
      })
      .returning()
      .execute();

    const componentInput = {
      ...testInput,
      project_id: projectResult[0].id,
      created_by: userResult[0].id
    };

    const result = await createComponent(componentInput);

    // Basic field validation
    expect(result.name).toEqual('Customer Management System');
    expect(result.description).toEqual('Application for managing customer data');
    expect(result.type).toEqual('application');
    expect(result.layer).toEqual('application');
    expect(result.project_id).toEqual(projectResult[0].id);
    expect(result.created_by).toEqual(userResult[0].id);
    expect(result.metadata).toEqual('{"version": "1.0", "tech_stack": "Node.js"}');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a component with minimal fields', async () => {
    // Create prerequisite records
    const orgResult = await db.insert(organizationsTable)
      .values({ name: 'Test Organization' })
      .returning()
      .execute();

    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        role: 'member',
        organization_id: orgResult[0].id
      })
      .returning()
      .execute();

    const projectResult = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        organization_id: orgResult[0].id,
        created_by: userResult[0].id
      })
      .returning()
      .execute();

    const minimalInput: CreateComponentInput = {
      name: 'Simple Component',
      type: 'business_process',
      layer: 'business',
      project_id: projectResult[0].id,
      created_by: userResult[0].id
    };

    const result = await createComponent(minimalInput);

    expect(result.name).toEqual('Simple Component');
    expect(result.description).toBeNull();
    expect(result.type).toEqual('business_process');
    expect(result.layer).toEqual('business');
    expect(result.metadata).toBeNull();
    expect(result.id).toBeDefined();
  });

  it('should save component to database', async () => {
    // Create prerequisite records
    const orgResult = await db.insert(organizationsTable)
      .values({ name: 'Test Organization' })
      .returning()
      .execute();

    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        role: 'member',
        organization_id: orgResult[0].id
      })
      .returning()
      .execute();

    const projectResult = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        organization_id: orgResult[0].id,
        created_by: userResult[0].id
      })
      .returning()
      .execute();

    const componentInput = {
      ...testInput,
      project_id: projectResult[0].id,
      created_by: userResult[0].id
    };

    const result = await createComponent(componentInput);

    // Query database to verify component was saved
    const components = await db.select()
      .from(componentsTable)
      .where(eq(componentsTable.id, result.id))
      .execute();

    expect(components).toHaveLength(1);
    expect(components[0].name).toEqual('Customer Management System');
    expect(components[0].type).toEqual('application');
    expect(components[0].layer).toEqual('application');
    expect(components[0].project_id).toEqual(projectResult[0].id);
    expect(components[0].created_by).toEqual(userResult[0].id);
    expect(components[0].created_at).toBeInstanceOf(Date);
    expect(components[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create components with different types and layers', async () => {
    // Create prerequisite records
    const orgResult = await db.insert(organizationsTable)
      .values({ name: 'Test Organization' })
      .returning()
      .execute();

    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        role: 'member',
        organization_id: orgResult[0].id
      })
      .returning()
      .execute();

    const projectResult = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        organization_id: orgResult[0].id,
        created_by: userResult[0].id
      })
      .returning()
      .execute();

    // Test different component types and layers
    const testCases = [
      { type: 'business_process' as const, layer: 'business' as const, name: 'Order Processing' },
      { type: 'data_entity' as const, layer: 'data' as const, name: 'Customer Data' },
      { type: 'service' as const, layer: 'application' as const, name: 'Payment Service' },
      { type: 'infrastructure_component' as const, layer: 'technology' as const, name: 'Load Balancer' }
    ];

    for (const testCase of testCases) {
      const componentInput: CreateComponentInput = {
        name: testCase.name,
        type: testCase.type,
        layer: testCase.layer,
        project_id: projectResult[0].id,
        created_by: userResult[0].id
      };

      const result = await createComponent(componentInput);

      expect(result.name).toEqual(testCase.name);
      expect(result.type).toEqual(testCase.type);
      expect(result.layer).toEqual(testCase.layer);
    }

    // Verify all components were created
    const allComponents = await db.select()
      .from(componentsTable)
      .where(eq(componentsTable.project_id, projectResult[0].id))
      .execute();

    expect(allComponents).toHaveLength(4);
  });

  it('should throw error for non-existent project', async () => {
    // Create only user, no project
    const orgResult = await db.insert(organizationsTable)
      .values({ name: 'Test Organization' })
      .returning()
      .execute();

    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        role: 'member',
        organization_id: orgResult[0].id
      })
      .returning()
      .execute();

    const invalidInput: CreateComponentInput = {
      name: 'Invalid Component',
      type: 'application',
      layer: 'application',
      project_id: 999,
      created_by: userResult[0].id
    };

    await expect(createComponent(invalidInput)).rejects.toThrow(/Project with id 999 does not exist/);
  });

  it('should throw error for non-existent user', async () => {
    // Create only project, no user for created_by
    const orgResult = await db.insert(organizationsTable)
      .values({ name: 'Test Organization' })
      .returning()
      .execute();

    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        role: 'member',
        organization_id: orgResult[0].id
      })
      .returning()
      .execute();

    const projectResult = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        organization_id: orgResult[0].id,
        created_by: userResult[0].id
      })
      .returning()
      .execute();

    const invalidInput: CreateComponentInput = {
      name: 'Invalid Component',
      type: 'application',
      layer: 'application',
      project_id: projectResult[0].id,
      created_by: 999
    };

    await expect(createComponent(invalidInput)).rejects.toThrow(/User with id 999 does not exist/);
  });
});

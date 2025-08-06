
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { componentsTable, organizationsTable, usersTable, projectsTable } from '../db/schema';
import { type UpdateComponentInput, type CreateOrganizationInput, type CreateUserInput, type CreateProjectInput, type CreateComponentInput } from '../schema';
import { updateComponent } from '../handlers/update_component';
import { eq } from 'drizzle-orm';

// Test data
const testOrganization: CreateOrganizationInput = {
  name: 'Test Organization',
  description: 'An organization for testing'
};

const testUser: CreateUserInput = {
  email: 'test@example.com',
  name: 'Test User',
  role: 'admin',
  organization_id: 1
};

const testProject: CreateProjectInput = {
  name: 'Test Project',
  description: 'A project for testing',
  organization_id: 1,
  created_by: 1
};

const testComponent: CreateComponentInput = {
  name: 'Test Component',
  description: 'A component for testing',
  type: 'application',
  layer: 'application',
  project_id: 1,
  created_by: 1,
  metadata: '{"version": "1.0"}'
};

describe('updateComponent', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update component name', async () => {
    // Create prerequisite data
    await db.insert(organizationsTable).values(testOrganization).execute();
    await db.insert(usersTable).values(testUser).execute();
    await db.insert(projectsTable).values(testProject).execute();
    
    // Create component
    const componentResult = await db.insert(componentsTable)
      .values(testComponent)
      .returning()
      .execute();
    
    const componentId = componentResult[0].id;

    // Update component name
    const updateInput: UpdateComponentInput = {
      id: componentId,
      name: 'Updated Component Name'
    };

    const result = await updateComponent(updateInput);

    expect(result.id).toEqual(componentId);
    expect(result.name).toEqual('Updated Component Name');
    expect(result.description).toEqual(testComponent.description || null);
    expect(result.type).toEqual(testComponent.type);
    expect(result.layer).toEqual(testComponent.layer);
    expect(result.metadata).toEqual(testComponent.metadata || null);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update component description', async () => {
    // Create prerequisite data
    await db.insert(organizationsTable).values(testOrganization).execute();
    await db.insert(usersTable).values(testUser).execute();
    await db.insert(projectsTable).values(testProject).execute();
    
    // Create component
    const componentResult = await db.insert(componentsTable)
      .values(testComponent)
      .returning()
      .execute();
    
    const componentId = componentResult[0].id;

    // Update component description
    const updateInput: UpdateComponentInput = {
      id: componentId,
      description: 'Updated description'
    };

    const result = await updateComponent(updateInput);

    expect(result.id).toEqual(componentId);
    expect(result.name).toEqual(testComponent.name);
    expect(result.description).toEqual('Updated description');
    expect(result.type).toEqual(testComponent.type);
    expect(result.layer).toEqual(testComponent.layer);
    expect(result.metadata).toEqual(testComponent.metadata || null);
  });

  it('should update component metadata', async () => {
    // Create prerequisite data
    await db.insert(organizationsTable).values(testOrganization).execute();
    await db.insert(usersTable).values(testUser).execute();
    await db.insert(projectsTable).values(testProject).execute();
    
    // Create component
    const componentResult = await db.insert(componentsTable)
      .values(testComponent)
      .returning()
      .execute();
    
    const componentId = componentResult[0].id;

    // Update component metadata
    const updateInput: UpdateComponentInput = {
      id: componentId,
      metadata: '{"version": "2.0", "updated": true}'
    };

    const result = await updateComponent(updateInput);

    expect(result.id).toEqual(componentId);
    expect(result.name).toEqual(testComponent.name);
    expect(result.description).toEqual(testComponent.description || null);
    expect(result.metadata).toEqual('{"version": "2.0", "updated": true}');
  });

  it('should update multiple fields at once', async () => {
    // Create prerequisite data
    await db.insert(organizationsTable).values(testOrganization).execute();
    await db.insert(usersTable).values(testUser).execute();
    await db.insert(projectsTable).values(testProject).execute();
    
    // Create component
    const componentResult = await db.insert(componentsTable)
      .values(testComponent)
      .returning()
      .execute();
    
    const componentId = componentResult[0].id;

    // Update multiple fields
    const updateInput: UpdateComponentInput = {
      id: componentId,
      name: 'Multi-updated Component',
      description: 'Multi-updated description',
      metadata: '{"multiUpdate": true}'
    };

    const result = await updateComponent(updateInput);

    expect(result.id).toEqual(componentId);
    expect(result.name).toEqual('Multi-updated Component');
    expect(result.description).toEqual('Multi-updated description');
    expect(result.metadata).toEqual('{"multiUpdate": true}');
  });

  it('should save changes to database', async () => {
    // Create prerequisite data
    await db.insert(organizationsTable).values(testOrganization).execute();
    await db.insert(usersTable).values(testUser).execute();
    await db.insert(projectsTable).values(testProject).execute();
    
    // Create component
    const componentResult = await db.insert(componentsTable)
      .values(testComponent)
      .returning()
      .execute();
    
    const componentId = componentResult[0].id;

    // Update component
    const updateInput: UpdateComponentInput = {
      id: componentId,
      name: 'Database Updated Component'
    };

    await updateComponent(updateInput);

    // Verify changes in database
    const components = await db.select()
      .from(componentsTable)
      .where(eq(componentsTable.id, componentId))
      .execute();

    expect(components).toHaveLength(1);
    expect(components[0].name).toEqual('Database Updated Component');
    expect(components[0].description).toEqual(testComponent.description || null);
  });

  it('should handle nullable description', async () => {
    // Create prerequisite data
    await db.insert(organizationsTable).values(testOrganization).execute();
    await db.insert(usersTable).values(testUser).execute();
    await db.insert(projectsTable).values(testProject).execute();
    
    // Create component
    const componentResult = await db.insert(componentsTable)
      .values(testComponent)
      .returning()
      .execute();
    
    const componentId = componentResult[0].id;

    // Update description to null
    const updateInput: UpdateComponentInput = {
      id: componentId,
      description: null
    };

    const result = await updateComponent(updateInput);

    expect(result.id).toEqual(componentId);
    expect(result.description).toBeNull();
  });

  it('should throw error for non-existent component', async () => {
    const updateInput: UpdateComponentInput = {
      id: 9999,
      name: 'Non-existent Component'
    };

    await expect(updateComponent(updateInput)).rejects.toThrow(/not found/i);
  });
});


import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { organizationsTable, usersTable, projectsTable, componentsTable } from '../db/schema';
import { getComponentReport } from '../handlers/get_component_report';

describe('getComponentReport', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty report for project with no components', async () => {
    // Create prerequisite data
    const [org] = await db.insert(organizationsTable)
      .values({ name: 'Test Org' })
      .returning()
      .execute();

    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
        organization_id: org.id
      })
      .returning()
      .execute();

    const [project] = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        organization_id: org.id,
        created_by: user.id
      })
      .returning()
      .execute();

    const result = await getComponentReport(project.id);

    expect(result.components).toHaveLength(0);
    expect(result.summary.total).toBe(0);
    expect(result.summary.by_layer).toEqual({});
    expect(result.summary.by_type).toEqual({});
  });

  it('should generate report with component details and summary', async () => {
    // Create prerequisite data
    const [org] = await db.insert(organizationsTable)
      .values({ name: 'Test Org' })
      .returning()
      .execute();

    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
        organization_id: org.id
      })
      .returning()
      .execute();

    const [project] = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        organization_id: org.id,
        created_by: user.id
      })
      .returning()
      .execute();

    // Create test components with different layers and types
    await db.insert(componentsTable)
      .values([
        {
          name: 'Customer Management',
          description: 'Business process for customer management',
          type: 'business_process',
          layer: 'business',
          project_id: project.id,
          created_by: user.id
        },
        {
          name: 'Customer Data',
          description: 'Customer data entity',
          type: 'data_entity',
          layer: 'data',
          project_id: project.id,
          created_by: user.id
        },
        {
          name: 'CRM Application',
          description: 'Customer relationship management app',
          type: 'application',
          layer: 'application',
          project_id: project.id,
          created_by: user.id
        },
        {
          name: 'Order Processing',
          description: 'Business process for order processing',
          type: 'business_process',
          layer: 'business',
          project_id: project.id,
          created_by: user.id
        }
      ])
      .execute();

    const result = await getComponentReport(project.id);

    // Verify component details
    expect(result.components).toHaveLength(4);
    expect(result.components[0].name).toBe('Customer Management');
    expect(result.components[0].type).toBe('business_process');
    expect(result.components[0].layer).toBe('business');
    expect(result.components[0].project_id).toBe(project.id);
    expect(result.components[0].created_by).toBe(user.id);
    expect(result.components[0].id).toBeDefined();
    expect(result.components[0].created_at).toBeInstanceOf(Date);
    expect(result.components[0].updated_at).toBeInstanceOf(Date);

    // Verify summary statistics
    expect(result.summary.total).toBe(4);
    expect(result.summary.by_layer).toEqual({
      business: 2,
      data: 1,
      application: 1
    });
    expect(result.summary.by_type).toEqual({
      business_process: 2,
      data_entity: 1,
      application: 1
    });
  });

  it('should only return components for specified project', async () => {
    // Create prerequisite data
    const [org] = await db.insert(organizationsTable)
      .values({ name: 'Test Org' })
      .returning()
      .execute();

    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
        organization_id: org.id
      })
      .returning()
      .execute();

    // Create two projects
    const [project1] = await db.insert(projectsTable)
      .values({
        name: 'Project 1',
        organization_id: org.id,
        created_by: user.id
      })
      .returning()
      .execute();

    const [project2] = await db.insert(projectsTable)
      .values({
        name: 'Project 2',
        organization_id: org.id,
        created_by: user.id
      })
      .returning()
      .execute();

    // Create components in both projects
    await db.insert(componentsTable)
      .values([
        {
          name: 'Component in Project 1',
          type: 'application',
          layer: 'application',
          project_id: project1.id,
          created_by: user.id
        },
        {
          name: 'Component in Project 2',
          type: 'service',
          layer: 'application',
          project_id: project2.id,
          created_by: user.id
        }
      ])
      .execute();

    const result = await getComponentReport(project1.id);

    // Should only return components from project1
    expect(result.components).toHaveLength(1);
    expect(result.components[0].name).toBe('Component in Project 1');
    expect(result.components[0].project_id).toBe(project1.id);
    expect(result.summary.total).toBe(1);
    expect(result.summary.by_type).toEqual({
      application: 1
    });
  });

  it('should handle components with metadata field', async () => {
    // Create prerequisite data
    const [org] = await db.insert(organizationsTable)
      .values({ name: 'Test Org' })
      .returning()
      .execute();

    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
        organization_id: org.id
      })
      .returning()
      .execute();

    const [project] = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        organization_id: org.id,
        created_by: user.id
      })
      .returning()
      .execute();

    // Create component with metadata
    const testMetadata = '{"version": "1.0", "owner": "team-a"}';
    await db.insert(componentsTable)
      .values({
        name: 'Component with Metadata',
        description: 'A component with JSON metadata',
        type: 'application',
        layer: 'application',
        project_id: project.id,
        created_by: user.id,
        metadata: testMetadata
      })
      .execute();

    const result = await getComponentReport(project.id);

    expect(result.components).toHaveLength(1);
    expect(result.components[0].metadata).toBe(testMetadata);
    expect(result.summary.total).toBe(1);
  });
});

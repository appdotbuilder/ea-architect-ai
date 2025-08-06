
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { organizationsTable, usersTable, projectsTable, componentsTable, componentRelationshipsTable, artifactsTable } from '../db/schema';
import { getProjectDashboard } from '../handlers/get_project_dashboard';

describe('getProjectDashboard', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let orgId: number;
  let userId: number;
  let projectId: number;

  beforeEach(async () => {
    // Create prerequisite data
    const orgResult = await db.insert(organizationsTable)
      .values({ name: 'Test Org', description: 'Test organization' })
      .returning()
      .execute();
    orgId = orgResult[0].id;

    const userResult = await db.insert(usersTable)
      .values({ 
        email: 'test@example.com', 
        name: 'Test User', 
        role: 'admin',
        organization_id: orgId 
      })
      .returning()
      .execute();
    userId = userResult[0].id;

    const projectResult = await db.insert(projectsTable)
      .values({ 
        name: 'Test Project', 
        organization_id: orgId, 
        created_by: userId,
        status: 'active'
      })
      .returning()
      .execute();
    projectId = projectResult[0].id;
  });

  it('should return empty dashboard for project with no data', async () => {
    const result = await getProjectDashboard(projectId);

    expect(result.project_id).toBe(projectId);
    expect(result.total_components).toBe(0);
    expect(result.components_by_layer).toEqual({
      business: 0,
      data: 0,
      application: 0,
      technology: 0
    });
    expect(result.total_relationships).toBe(0);
    expect(result.total_artifacts).toBe(0);
    expect(result.recent_activity).toEqual([]);
  });

  it('should count components by layer correctly', async () => {
    // Create components in different layers
    await db.insert(componentsTable)
      .values([
        {
          name: 'Business Process 1',
          type: 'business_process',
          layer: 'business',
          project_id: projectId,
          created_by: userId
        },
        {
          name: 'Business Process 2',
          type: 'capability',
          layer: 'business',
          project_id: projectId,
          created_by: userId
        },
        {
          name: 'Data Entity',
          type: 'data_entity',
          layer: 'data',
          project_id: projectId,
          created_by: userId
        },
        {
          name: 'Application',
          type: 'application',
          layer: 'application',
          project_id: projectId,
          created_by: userId
        }
      ])
      .execute();

    const result = await getProjectDashboard(projectId);

    expect(result.total_components).toBe(4);
    expect(result.components_by_layer).toEqual({
      business: 2,
      data: 1,
      application: 1,
      technology: 0
    });
  });

  it('should count relationships for project components', async () => {
    // Create components
    const componentsResult = await db.insert(componentsTable)
      .values([
        {
          name: 'Component 1',
          type: 'business_process',
          layer: 'business',
          project_id: projectId,
          created_by: userId
        },
        {
          name: 'Component 2',
          type: 'application',
          layer: 'application',
          project_id: projectId,
          created_by: userId
        }
      ])
      .returning()
      .execute();

    const comp1Id = componentsResult[0].id;
    const comp2Id = componentsResult[1].id;

    // Create relationships
    await db.insert(componentRelationshipsTable)
      .values([
        {
          source_component_id: comp1Id,
          target_component_id: comp2Id,
          relationship_type: 'depends_on',
          created_by: userId
        }
      ])
      .execute();

    const result = await getProjectDashboard(projectId);

    expect(result.total_relationships).toBe(1);
  });

  it('should count artifacts correctly', async () => {
    // Create artifacts
    await db.insert(artifactsTable)
      .values([
        {
          name: 'Document 1',
          file_path: '/docs/doc1.pdf',
          file_type: 'pdf',
          file_size: 1024,
          project_id: projectId,
          uploaded_by: userId
        },
        {
          name: 'Document 2',
          file_path: '/docs/doc2.pdf',
          file_type: 'pdf',
          file_size: 2048,
          project_id: projectId,
          uploaded_by: userId
        }
      ])
      .execute();

    const result = await getProjectDashboard(projectId);

    expect(result.total_artifacts).toBe(2);
  });

  it('should generate recent activity from components and artifacts', async () => {
    // Create a component
    await db.insert(componentsTable)
      .values({
        name: 'Test Component',
        type: 'business_process',
        layer: 'business',
        project_id: projectId,
        created_by: userId
      })
      .execute();

    // Create an artifact
    await db.insert(artifactsTable)
      .values({
        name: 'Test Artifact',
        file_path: '/docs/test.pdf',
        file_type: 'pdf',
        file_size: 1024,
        project_id: projectId,
        uploaded_by: userId
      })
      .execute();

    const result = await getProjectDashboard(projectId);

    expect(result.recent_activity).toHaveLength(2);
    
    // Check activity types and descriptions
    const componentActivity = result.recent_activity.find(activity => activity.type === 'component_created');
    const artifactActivity = result.recent_activity.find(activity => activity.type === 'artifact_uploaded');

    expect(componentActivity).toBeDefined();
    expect(componentActivity?.description).toBe('Component "Test Component" was created');
    expect(componentActivity?.timestamp).toBeInstanceOf(Date);

    expect(artifactActivity).toBeDefined();
    expect(artifactActivity?.description).toBe('Artifact "Test Artifact" was uploaded');
    expect(artifactActivity?.timestamp).toBeInstanceOf(Date);
  });

  it('should only include data from the specified project', async () => {
    // Create another project
    const otherProjectResult = await db.insert(projectsTable)
      .values({
        name: 'Other Project',
        organization_id: orgId,
        created_by: userId,
        status: 'active'
      })
      .returning()
      .execute();
    const otherProjectId = otherProjectResult[0].id;

    // Create components in both projects
    await db.insert(componentsTable)
      .values([
        {
          name: 'Component in Test Project',
          type: 'business_process',
          layer: 'business',
          project_id: projectId,
          created_by: userId
        },
        {
          name: 'Component in Other Project',
          type: 'application',
          layer: 'application',
          project_id: otherProjectId,
          created_by: userId
        }
      ])
      .execute();

    const result = await getProjectDashboard(projectId);

    // Should only count components from the test project
    expect(result.total_components).toBe(1);
    expect(result.components_by_layer['business']).toBe(1);
    expect(result.components_by_layer['application']).toBe(0);
  });
});

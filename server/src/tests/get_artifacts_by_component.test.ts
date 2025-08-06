
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { organizationsTable, usersTable, projectsTable, componentsTable, artifactsTable } from '../db/schema';
import { type CreateOrganizationInput, type CreateUserInput, type CreateProjectInput, type CreateComponentInput, type CreateArtifactInput } from '../schema';
import { getArtifactsByComponent } from '../handlers/get_artifacts_by_component';

// Test data setup
const testOrganization: CreateOrganizationInput = {
  name: 'Test Organization',
  description: 'Organization for testing'
};

const testUser: CreateUserInput = {
  email: 'test@example.com',
  name: 'Test User',
  role: 'admin'
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
  metadata: null
};

const testArtifact1: CreateArtifactInput = {
  name: 'Test Document 1',
  description: 'First test artifact',
  file_path: '/uploads/doc1.pdf',
  file_type: 'application/pdf',
  file_size: 1024,
  component_id: 1,
  project_id: 1,
  uploaded_by: 1
};

const testArtifact2: CreateArtifactInput = {
  name: 'Test Document 2',
  description: 'Second test artifact',
  file_path: '/uploads/doc2.pdf',
  file_type: 'application/pdf',
  file_size: 2048,
  component_id: 1,
  project_id: 1,
  uploaded_by: 1
};

const testArtifact3: CreateArtifactInput = {
  name: 'Different Component Artifact',
  description: 'Artifact for different component',
  file_path: '/uploads/doc3.pdf',
  file_type: 'application/pdf',
  file_size: 512,
  component_id: 2,
  project_id: 1,
  uploaded_by: 1
};

describe('getArtifactsByComponent', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return artifacts for a specific component', async () => {
    // Create prerequisite data
    await db.insert(organizationsTable).values(testOrganization).execute();
    await db.insert(usersTable).values({ ...testUser, organization_id: 1 }).execute();
    await db.insert(projectsTable).values(testProject).execute();
    await db.insert(componentsTable).values(testComponent).execute();
    
    // Create artifacts for component 1
    await db.insert(artifactsTable).values(testArtifact1).execute();
    await db.insert(artifactsTable).values(testArtifact2).execute();

    const results = await getArtifactsByComponent(1);

    expect(results).toHaveLength(2);
    expect(results[0].name).toEqual('Test Document 1');
    expect(results[0].description).toEqual('First test artifact');
    expect(results[0].file_path).toEqual('/uploads/doc1.pdf');
    expect(results[0].file_type).toEqual('application/pdf');
    expect(results[0].file_size).toEqual(1024);
    expect(results[0].component_id).toEqual(1);
    expect(results[0].project_id).toEqual(1);
    expect(results[0].uploaded_by).toEqual(1);
    expect(results[0].created_at).toBeInstanceOf(Date);

    expect(results[1].name).toEqual('Test Document 2');
    expect(results[1].component_id).toEqual(1);
  });

  it('should return empty array when component has no artifacts', async () => {
    // Create prerequisite data
    await db.insert(organizationsTable).values(testOrganization).execute();
    await db.insert(usersTable).values({ ...testUser, organization_id: 1 }).execute();
    await db.insert(projectsTable).values(testProject).execute();
    await db.insert(componentsTable).values(testComponent).execute();

    const results = await getArtifactsByComponent(1);

    expect(results).toHaveLength(0);
  });

  it('should only return artifacts for the specified component', async () => {
    // Create prerequisite data
    await db.insert(organizationsTable).values(testOrganization).execute();
    await db.insert(usersTable).values({ ...testUser, organization_id: 1 }).execute();
    await db.insert(projectsTable).values(testProject).execute();
    await db.insert(componentsTable).values(testComponent).execute();
    
    // Create second component
    const secondComponent: CreateComponentInput = {
      name: 'Second Component',
      description: 'Another component',
      type: 'service',
      layer: 'application',
      project_id: 1,
      created_by: 1,
      metadata: null
    };
    await db.insert(componentsTable).values(secondComponent).execute();

    // Create artifacts for both components
    await db.insert(artifactsTable).values(testArtifact1).execute();
    await db.insert(artifactsTable).values(testArtifact3).execute();

    const results = await getArtifactsByComponent(1);

    expect(results).toHaveLength(1);
    expect(results[0].name).toEqual('Test Document 1');
    expect(results[0].component_id).toEqual(1);
  });

  it('should return empty array for non-existent component', async () => {
    const results = await getArtifactsByComponent(999);

    expect(results).toHaveLength(0);
  });
});

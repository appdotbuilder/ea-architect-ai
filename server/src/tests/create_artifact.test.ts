
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { artifactsTable, organizationsTable, usersTable, projectsTable, componentsTable } from '../db/schema';
import { type CreateArtifactInput } from '../schema';
import { createArtifact } from '../handlers/create_artifact';
import { eq } from 'drizzle-orm';

describe('createArtifact', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let orgId: number;
  let userId: number;
  let projectId: number;
  let componentId: number;

  beforeEach(async () => {
    // Create prerequisite records
    const org = await db.insert(organizationsTable)
      .values({ name: 'Test Org', description: 'Test organization' })
      .returning()
      .execute();
    orgId = org[0].id;

    const user = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
        organization_id: orgId
      })
      .returning()
      .execute();
    userId = user[0].id;

    const project = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        description: 'Test project',
        organization_id: orgId,
        created_by: userId
      })
      .returning()
      .execute();
    projectId = project[0].id;

    const component = await db.insert(componentsTable)
      .values({
        name: 'Test Component',
        description: 'Test component',
        type: 'application',
        layer: 'application',
        project_id: projectId,
        created_by: userId
      })
      .returning()
      .execute();
    componentId = component[0].id;
  });

  const testInput: CreateArtifactInput = {
    name: 'Test Document',
    description: 'A test artifact document',
    file_path: '/uploads/test-doc.pdf',
    file_type: 'application/pdf',
    file_size: 1024000,
    component_id: 0, // Will be set in tests
    project_id: 0, // Will be set in tests
    uploaded_by: 0 // Will be set in tests
  };

  it('should create an artifact with component association', async () => {
    const input = {
      ...testInput,
      component_id: componentId,
      project_id: projectId,
      uploaded_by: userId
    };

    const result = await createArtifact(input);

    expect(result.name).toEqual('Test Document');
    expect(result.description).toEqual('A test artifact document');
    expect(result.file_path).toEqual('/uploads/test-doc.pdf');
    expect(result.file_type).toEqual('application/pdf');
    expect(result.file_size).toEqual(1024000);
    expect(result.component_id).toEqual(componentId);
    expect(result.project_id).toEqual(projectId);
    expect(result.uploaded_by).toEqual(userId);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create an artifact without component association', async () => {
    const input = {
      ...testInput,
      component_id: undefined,
      project_id: projectId,
      uploaded_by: userId
    };

    const result = await createArtifact(input);

    expect(result.name).toEqual('Test Document');
    expect(result.component_id).toBeNull();
    expect(result.project_id).toEqual(projectId);
    expect(result.uploaded_by).toEqual(userId);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save artifact to database', async () => {
    const input = {
      ...testInput,
      component_id: componentId,
      project_id: projectId,
      uploaded_by: userId
    };

    const result = await createArtifact(input);

    const artifacts = await db.select()
      .from(artifactsTable)
      .where(eq(artifactsTable.id, result.id))
      .execute();

    expect(artifacts).toHaveLength(1);
    expect(artifacts[0].name).toEqual('Test Document');
    expect(artifacts[0].description).toEqual('A test artifact document');
    expect(artifacts[0].file_path).toEqual('/uploads/test-doc.pdf');
    expect(artifacts[0].file_type).toEqual('application/pdf');
    expect(artifacts[0].file_size).toEqual(1024000);
    expect(artifacts[0].component_id).toEqual(componentId);
    expect(artifacts[0].project_id).toEqual(projectId);
    expect(artifacts[0].uploaded_by).toEqual(userId);
    expect(artifacts[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle artifacts with null description', async () => {
    const input = {
      ...testInput,
      description: undefined,
      component_id: componentId,
      project_id: projectId,
      uploaded_by: userId
    };

    const result = await createArtifact(input);

    expect(result.description).toBeNull();
  });

  it('should throw error for non-existent project', async () => {
    const input = {
      ...testInput,
      project_id: 99999,
      uploaded_by: userId
    };

    expect(createArtifact(input)).rejects.toThrow(/project.*not found/i);
  });

  it('should throw error for non-existent user', async () => {
    const input = {
      ...testInput,
      project_id: projectId,
      uploaded_by: 99999
    };

    expect(createArtifact(input)).rejects.toThrow(/user.*not found/i);
  });

  it('should throw error for non-existent component', async () => {
    const input = {
      ...testInput,
      component_id: 99999,
      project_id: projectId,
      uploaded_by: userId
    };

    expect(createArtifact(input)).rejects.toThrow(/component.*not found/i);
  });
});

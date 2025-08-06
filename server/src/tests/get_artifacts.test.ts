
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { artifactsTable, usersTable, organizationsTable, projectsTable, componentsTable } from '../db/schema';
import { getArtifacts } from '../handlers/get_artifacts';

describe('getArtifacts', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no artifacts exist', async () => {
    const results = await getArtifacts();
    expect(results).toEqual([]);
  });

  it('should return all artifacts', async () => {
    // Create prerequisite data
    const org = await db.insert(organizationsTable)
      .values({
        name: 'Test Organization',
        description: 'Test org description'
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
        description: 'Test project description',
        organization_id: org[0].id,
        created_by: user[0].id,
        status: 'active'
      })
      .returning()
      .execute();

    // Create test artifacts
    const artifact1 = await db.insert(artifactsTable)
      .values({
        name: 'Test Document 1',
        description: 'First test artifact',
        file_path: '/uploads/doc1.pdf',
        file_type: 'application/pdf',
        file_size: 1024,
        component_id: null,
        project_id: project[0].id,
        uploaded_by: user[0].id
      })
      .returning()
      .execute();

    const artifact2 = await db.insert(artifactsTable)
      .values({
        name: 'Test Document 2',
        description: 'Second test artifact',
        file_path: '/uploads/doc2.docx',
        file_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        file_size: 2048,
        component_id: null,
        project_id: project[0].id,
        uploaded_by: user[0].id
      })
      .returning()
      .execute();

    const results = await getArtifacts();

    expect(results).toHaveLength(2);
    
    // Check first artifact
    const result1 = results.find(r => r.name === 'Test Document 1');
    expect(result1).toBeDefined();
    expect(result1!.name).toEqual('Test Document 1');
    expect(result1!.description).toEqual('First test artifact');
    expect(result1!.file_path).toEqual('/uploads/doc1.pdf');
    expect(result1!.file_type).toEqual('application/pdf');
    expect(result1!.file_size).toEqual(1024);
    expect(result1!.component_id).toBeNull();
    expect(result1!.project_id).toEqual(project[0].id);
    expect(result1!.uploaded_by).toEqual(user[0].id);
    expect(result1!.created_at).toBeInstanceOf(Date);
    expect(result1!.id).toBeDefined();

    // Check second artifact
    const result2 = results.find(r => r.name === 'Test Document 2');
    expect(result2).toBeDefined();
    expect(result2!.name).toEqual('Test Document 2');
    expect(result2!.description).toEqual('Second test artifact');
    expect(result2!.file_path).toEqual('/uploads/doc2.docx');
    expect(result2!.file_type).toEqual('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    expect(result2!.file_size).toEqual(2048);
    expect(result2!.component_id).toBeNull();
    expect(result2!.project_id).toEqual(project[0].id);
    expect(result2!.uploaded_by).toEqual(user[0].id);
    expect(result2!.created_at).toBeInstanceOf(Date);
    expect(result2!.id).toBeDefined();
  });

  it('should return artifacts with component associations', async () => {
    // Create prerequisite data
    const org = await db.insert(organizationsTable)
      .values({
        name: 'Test Organization',
        description: 'Test org description'
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
        description: 'Test project description',
        organization_id: org[0].id,
        created_by: user[0].id,
        status: 'active'
      })
      .returning()
      .execute();

    // Create a component
    const component = await db.insert(componentsTable)
      .values({
        name: 'Test Component',
        description: 'Test component description',
        type: 'application',
        layer: 'application',
        project_id: project[0].id,
        created_by: user[0].id,
        metadata: null
      })
      .returning()
      .execute();

    // Create artifact with component association
    await db.insert(artifactsTable)
      .values({
        name: 'Component Artifact',
        description: 'Artifact linked to component',
        file_path: '/uploads/component-doc.pdf',
        file_type: 'application/pdf',
        file_size: 512,
        component_id: component[0].id,
        project_id: project[0].id,
        uploaded_by: user[0].id
      })
      .returning()
      .execute();

    const results = await getArtifacts();

    expect(results).toHaveLength(1);
    expect(results[0].component_id).toEqual(component[0].id);
    expect(results[0].name).toEqual('Component Artifact');
  });

  it('should handle multiple artifacts from different projects', async () => {
    // Create prerequisite data
    const org = await db.insert(organizationsTable)
      .values({
        name: 'Test Organization',
        description: 'Test org description'
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

    // Create two projects
    const project1 = await db.insert(projectsTable)
      .values({
        name: 'Project 1',
        description: 'First project',
        organization_id: org[0].id,
        created_by: user[0].id,
        status: 'active'
      })
      .returning()
      .execute();

    const project2 = await db.insert(projectsTable)
      .values({
        name: 'Project 2',
        description: 'Second project',
        organization_id: org[0].id,
        created_by: user[0].id,
        status: 'active'
      })
      .returning()
      .execute();

    // Create artifacts for different projects
    await db.insert(artifactsTable)
      .values({
        name: 'Project 1 Artifact',
        description: 'Artifact for project 1',
        file_path: '/uploads/proj1-doc.pdf',
        file_type: 'application/pdf',
        file_size: 1024,
        component_id: null,
        project_id: project1[0].id,
        uploaded_by: user[0].id
      })
      .returning()
      .execute();

    await db.insert(artifactsTable)
      .values({
        name: 'Project 2 Artifact',
        description: 'Artifact for project 2',
        file_path: '/uploads/proj2-doc.pdf',
        file_type: 'application/pdf',
        file_size: 2048,
        component_id: null,
        project_id: project2[0].id,
        uploaded_by: user[0].id
      })
      .returning()
      .execute();

    const results = await getArtifacts();

    expect(results).toHaveLength(2);
    
    const proj1Artifact = results.find(r => r.name === 'Project 1 Artifact');
    const proj2Artifact = results.find(r => r.name === 'Project 2 Artifact');
    
    expect(proj1Artifact).toBeDefined();
    expect(proj1Artifact!.project_id).toEqual(project1[0].id);
    
    expect(proj2Artifact).toBeDefined();
    expect(proj2Artifact!.project_id).toEqual(project2[0].id);
  });
});

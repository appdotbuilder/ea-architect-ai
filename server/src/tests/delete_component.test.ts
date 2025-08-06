
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { 
  organizationsTable, 
  usersTable, 
  projectsTable, 
  componentsTable, 
  componentRelationshipsTable, 
  artifactsTable 
} from '../db/schema';
import { eq } from 'drizzle-orm';
import { deleteComponent } from '../handlers/delete_component';

describe('deleteComponent', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a component successfully', async () => {
    // Create prerequisite data
    const orgResult = await db.insert(organizationsTable)
      .values({
        name: 'Test Org',
        description: 'A test organization'
      })
      .returning()
      .execute();

    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
        organization_id: orgResult[0].id
      })
      .returning()
      .execute();

    const projectResult = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        description: 'A test project',
        organization_id: orgResult[0].id,
        created_by: userResult[0].id,
        status: 'active'
      })
      .returning()
      .execute();

    const componentResult = await db.insert(componentsTable)
      .values({
        name: 'Test Component',
        description: 'A test component',
        type: 'application',
        layer: 'application',
        project_id: projectResult[0].id,
        created_by: userResult[0].id
      })
      .returning()
      .execute();

    // Verify component exists
    const componentsBefore = await db.select()
      .from(componentsTable)
      .where(eq(componentsTable.id, componentResult[0].id))
      .execute();
    expect(componentsBefore).toHaveLength(1);

    // Delete the component
    await deleteComponent(componentResult[0].id);

    // Verify component is deleted
    const componentsAfter = await db.select()
      .from(componentsTable)
      .where(eq(componentsTable.id, componentResult[0].id))
      .execute();
    expect(componentsAfter).toHaveLength(0);
  });

  it('should delete all associated relationships when deleting a component', async () => {
    // Create prerequisite data
    const orgResult = await db.insert(organizationsTable)
      .values({
        name: 'Test Org',
        description: 'A test organization'
      })
      .returning()
      .execute();

    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
        organization_id: orgResult[0].id
      })
      .returning()
      .execute();

    const projectResult = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        description: 'A test project',
        organization_id: orgResult[0].id,
        created_by: userResult[0].id,
        status: 'active'
      })
      .returning()
      .execute();

    // Create two components
    const component1Result = await db.insert(componentsTable)
      .values({
        name: 'Component 1',
        description: 'First component',
        type: 'application',
        layer: 'application',
        project_id: projectResult[0].id,
        created_by: userResult[0].id
      })
      .returning()
      .execute();

    const component2Result = await db.insert(componentsTable)
      .values({
        name: 'Component 2',
        description: 'Second component',
        type: 'service',
        layer: 'application',
        project_id: projectResult[0].id,
        created_by: userResult[0].id
      })
      .returning()
      .execute();

    // Create relationships where component1 is source and target
    await db.insert(componentRelationshipsTable)
      .values({
        source_component_id: component1Result[0].id,
        target_component_id: component2Result[0].id,
        relationship_type: 'depends_on',
        description: 'Component 1 depends on Component 2',
        created_by: userResult[0].id
      })
      .execute();

    await db.insert(componentRelationshipsTable)
      .values({
        source_component_id: component2Result[0].id,
        target_component_id: component1Result[0].id,
        relationship_type: 'supports',
        description: 'Component 2 supports Component 1',
        created_by: userResult[0].id
      })
      .execute();

    // Verify relationships exist
    const relationshipsBefore = await db.select()
      .from(componentRelationshipsTable)
      .execute();
    expect(relationshipsBefore).toHaveLength(2);

    // Delete component1
    await deleteComponent(component1Result[0].id);

    // Verify all relationships involving component1 are deleted
    const relationshipsAfter = await db.select()
      .from(componentRelationshipsTable)
      .execute();
    expect(relationshipsAfter).toHaveLength(0);

    // Verify component2 still exists
    const component2After = await db.select()
      .from(componentsTable)
      .where(eq(componentsTable.id, component2Result[0].id))
      .execute();
    expect(component2After).toHaveLength(1);
  });

  it('should delete all associated artifacts when deleting a component', async () => {
    // Create prerequisite data
    const orgResult = await db.insert(organizationsTable)
      .values({
        name: 'Test Org',
        description: 'A test organization'
      })
      .returning()
      .execute();

    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
        organization_id: orgResult[0].id
      })
      .returning()
      .execute();

    const projectResult = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        description: 'A test project',
        organization_id: orgResult[0].id,
        created_by: userResult[0].id,
        status: 'active'
      })
      .returning()
      .execute();

    const componentResult = await db.insert(componentsTable)
      .values({
        name: 'Test Component',
        description: 'A test component',
        type: 'application',
        layer: 'application',
        project_id: projectResult[0].id,
        created_by: userResult[0].id
      })
      .returning()
      .execute();

    // Create artifacts associated with the component
    await db.insert(artifactsTable)
      .values({
        name: 'Artifact 1',
        description: 'First artifact',
        file_path: '/path/to/artifact1.pdf',
        file_type: 'pdf',
        file_size: 1024,
        component_id: componentResult[0].id,
        project_id: projectResult[0].id,
        uploaded_by: userResult[0].id
      })
      .execute();

    await db.insert(artifactsTable)
      .values({
        name: 'Artifact 2',
        description: 'Second artifact',
        file_path: '/path/to/artifact2.docx',
        file_type: 'docx',
        file_size: 2048,
        component_id: componentResult[0].id,
        project_id: projectResult[0].id,
        uploaded_by: userResult[0].id
      })
      .execute();

    // Create an artifact NOT associated with the component (should remain)
    await db.insert(artifactsTable)
      .values({
        name: 'Unrelated Artifact',
        description: 'Not associated with component',
        file_path: '/path/to/unrelated.txt',
        file_type: 'txt',
        file_size: 512,
        component_id: null,
        project_id: projectResult[0].id,
        uploaded_by: userResult[0].id
      })
      .execute();

    // Verify artifacts exist
    const artifactsBefore = await db.select()
      .from(artifactsTable)
      .execute();
    expect(artifactsBefore).toHaveLength(3);

    const componentArtifactsBefore = await db.select()
      .from(artifactsTable)
      .where(eq(artifactsTable.component_id, componentResult[0].id))
      .execute();
    expect(componentArtifactsBefore).toHaveLength(2);

    // Delete the component
    await deleteComponent(componentResult[0].id);

    // Verify component artifacts are deleted
    const componentArtifactsAfter = await db.select()
      .from(artifactsTable)
      .where(eq(artifactsTable.component_id, componentResult[0].id))
      .execute();
    expect(componentArtifactsAfter).toHaveLength(0);

    // Verify unrelated artifact still exists
    const artifactsAfter = await db.select()
      .from(artifactsTable)
      .execute();
    expect(artifactsAfter).toHaveLength(1);
    expect(artifactsAfter[0].name).toBe('Unrelated Artifact');
  });

  it('should handle deletion of non-existent component gracefully', async () => {
    // Attempt to delete a component that doesn't exist - should not throw
    await deleteComponent(999);

    // Verify no changes to database
    const components = await db.select()
      .from(componentsTable)
      .execute();
    expect(components).toHaveLength(0);
  });
});

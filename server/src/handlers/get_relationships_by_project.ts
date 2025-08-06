
import { db } from '../db';
import { componentRelationshipsTable, componentsTable } from '../db/schema';
import { type ComponentRelationship } from '../schema';
import { eq } from 'drizzle-orm';

export async function getRelationshipsByProject(projectId: number): Promise<ComponentRelationship[]> {
  try {
    // Get all relationships where both source and target components belong to the project
    const results = await db.select({
      id: componentRelationshipsTable.id,
      source_component_id: componentRelationshipsTable.source_component_id,
      target_component_id: componentRelationshipsTable.target_component_id,
      relationship_type: componentRelationshipsTable.relationship_type,
      description: componentRelationshipsTable.description,
      created_by: componentRelationshipsTable.created_by,
      created_at: componentRelationshipsTable.created_at
    })
    .from(componentRelationshipsTable)
    .innerJoin(
      componentsTable,
      eq(componentRelationshipsTable.source_component_id, componentsTable.id)
    )
    .where(eq(componentsTable.project_id, projectId))
    .execute();

    return results;
  } catch (error) {
    console.error('Failed to get relationships by project:', error);
    throw error;
  }
}

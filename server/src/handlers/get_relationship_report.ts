
import { db } from '../db';
import { componentRelationshipsTable, componentsTable } from '../db/schema';
import { type ComponentRelationship } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function getRelationshipReport(projectId: number): Promise<{
  relationships: ComponentRelationship[];
  summary: {
    total: number;
    by_type: Record<string, number>;
  };
}> {
  try {
    // Query all relationships where both source and target components belong to the project
    const results = await db.select()
      .from(componentRelationshipsTable)
      .innerJoin(
        componentsTable, 
        eq(componentRelationshipsTable.source_component_id, componentsTable.id)
      )
      .where(eq(componentsTable.project_id, projectId))
      .execute();

    // Filter relationships to ensure target component is also in the same project
    const validRelationshipIds: number[] = [];
    
    for (const result of results) {
      // Check if target component is also in the same project
      const targetComponents = await db.select()
        .from(componentsTable)
        .where(
          and(
            eq(componentsTable.id, result.component_relationships.target_component_id),
            eq(componentsTable.project_id, projectId)
          )
        )
        .execute();
      
      if (targetComponents.length > 0) {
        validRelationshipIds.push(result.component_relationships.id);
      }
    }

    // Get the final relationships that have both components in the project
    const relationships: ComponentRelationship[] = results
      .filter(result => validRelationshipIds.includes(result.component_relationships.id))
      .map(result => ({
        id: result.component_relationships.id,
        source_component_id: result.component_relationships.source_component_id,
        target_component_id: result.component_relationships.target_component_id,
        relationship_type: result.component_relationships.relationship_type,
        description: result.component_relationships.description,
        created_by: result.component_relationships.created_by,
        created_at: result.component_relationships.created_at
      }));

    // Calculate summary statistics
    const total = relationships.length;
    const by_type: Record<string, number> = {};

    relationships.forEach(rel => {
      by_type[rel.relationship_type] = (by_type[rel.relationship_type] || 0) + 1;
    });

    return {
      relationships,
      summary: {
        total,
        by_type
      }
    };
  } catch (error) {
    console.error('Relationship report generation failed:', error);
    throw error;
  }
}

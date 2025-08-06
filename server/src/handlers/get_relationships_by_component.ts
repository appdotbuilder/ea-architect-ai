
import { db } from '../db';
import { componentRelationshipsTable } from '../db/schema';
import { type ComponentRelationship } from '../schema';
import { eq, or } from 'drizzle-orm';

export async function getRelationshipsByComponent(componentId: number): Promise<ComponentRelationship[]> {
  try {
    // Query for relationships where the component is either source or target
    const results = await db.select()
      .from(componentRelationshipsTable)
      .where(
        or(
          eq(componentRelationshipsTable.source_component_id, componentId),
          eq(componentRelationshipsTable.target_component_id, componentId)
        )
      )
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch relationships by component:', error);
    throw error;
  }
}

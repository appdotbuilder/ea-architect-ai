
import { db } from '../db';
import { componentsTable, componentRelationshipsTable, artifactsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function deleteComponent(id: number): Promise<void> {
  try {
    // Delete in proper order to handle foreign key constraints
    // 1. Delete all relationships where this component is source or target
    await db.delete(componentRelationshipsTable)
      .where(eq(componentRelationshipsTable.source_component_id, id))
      .execute();
    
    await db.delete(componentRelationshipsTable)
      .where(eq(componentRelationshipsTable.target_component_id, id))
      .execute();

    // 2. Delete all artifacts associated with this component
    await db.delete(artifactsTable)
      .where(eq(artifactsTable.component_id, id))
      .execute();

    // 3. Finally delete the component itself
    await db.delete(componentsTable)
      .where(eq(componentsTable.id, id))
      .execute();
  } catch (error) {
    console.error('Component deletion failed:', error);
    throw error;
  }
}

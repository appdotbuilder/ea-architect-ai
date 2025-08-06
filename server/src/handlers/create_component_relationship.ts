
import { db } from '../db';
import { componentRelationshipsTable, componentsTable } from '../db/schema';
import { type CreateComponentRelationshipInput, type ComponentRelationship } from '../schema';
import { eq, and } from 'drizzle-orm';

export const createComponentRelationship = async (input: CreateComponentRelationshipInput): Promise<ComponentRelationship> => {
  try {
    // Validate that both components exist and belong to the same project
    const sourceComponent = await db.select()
      .from(componentsTable)
      .where(eq(componentsTable.id, input.source_component_id))
      .execute();

    if (sourceComponent.length === 0) {
      throw new Error(`Source component with id ${input.source_component_id} not found`);
    }

    const targetComponent = await db.select()
      .from(componentsTable)
      .where(eq(componentsTable.id, input.target_component_id))
      .execute();

    if (targetComponent.length === 0) {
      throw new Error(`Target component with id ${input.target_component_id} not found`);
    }

    // Ensure both components belong to the same project
    if (sourceComponent[0].project_id !== targetComponent[0].project_id) {
      throw new Error('Components must belong to the same project to create a relationship');
    }

    // Prevent self-relationships
    if (input.source_component_id === input.target_component_id) {
      throw new Error('Cannot create relationship from component to itself');
    }

    // Insert component relationship record
    const result = await db.insert(componentRelationshipsTable)
      .values({
        source_component_id: input.source_component_id,
        target_component_id: input.target_component_id,
        relationship_type: input.relationship_type,
        description: input.description || null,
        created_by: input.created_by
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Component relationship creation failed:', error);
    throw error;
  }
};

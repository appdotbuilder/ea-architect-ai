
import { db } from '../db';
import { componentsTable } from '../db/schema';
import { type UpdateComponentInput, type Component } from '../schema';
import { eq } from 'drizzle-orm';

export const updateComponent = async (input: UpdateComponentInput): Promise<Component> => {
  try {
    // Build update object with only provided fields
    const updateData: any = {};
    
    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    
    if (input.metadata !== undefined) {
      updateData.metadata = input.metadata;
    }

    // Always update the updated_at timestamp
    updateData.updated_at = new Date();

    // Update component record
    const result = await db.update(componentsTable)
      .set(updateData)
      .where(eq(componentsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Component with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Component update failed:', error);
    throw error;
  }
};

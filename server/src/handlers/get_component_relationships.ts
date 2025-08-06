
import { db } from '../db';
import { componentRelationshipsTable } from '../db/schema';
import { type ComponentRelationship } from '../schema';

export const getComponentRelationships = async (): Promise<ComponentRelationship[]> => {
  try {
    const results = await db.select()
      .from(componentRelationshipsTable)
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch component relationships:', error);
    throw error;
  }
};

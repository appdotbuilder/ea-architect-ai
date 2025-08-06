
import { db } from '../db';
import { componentRelationshipsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteComponentRelationship = async (id: number): Promise<void> => {
  try {
    await db.delete(componentRelationshipsTable)
      .where(eq(componentRelationshipsTable.id, id))
      .execute();
  } catch (error) {
    console.error('Component relationship deletion failed:', error);
    throw error;
  }
};

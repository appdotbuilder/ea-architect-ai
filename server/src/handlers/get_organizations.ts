
import { db } from '../db';
import { organizationsTable } from '../db/schema';
import { type Organization } from '../schema';

export const getOrganizations = async (): Promise<Organization[]> => {
  try {
    const result = await db.select()
      .from(organizationsTable)
      .execute();

    return result;
  } catch (error) {
    console.error('Failed to fetch organizations:', error);
    throw error;
  }
};

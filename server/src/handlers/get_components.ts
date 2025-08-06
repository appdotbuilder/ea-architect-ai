
import { db } from '../db';
import { componentsTable } from '../db/schema';
import { type Component } from '../schema';

export const getComponents = async (): Promise<Component[]> => {
  try {
    const results = await db.select()
      .from(componentsTable)
      .execute();

    return results.map(component => ({
      ...component,
      // No numeric conversions needed - all fields are already correct types
      created_at: component.created_at,
      updated_at: component.updated_at
    }));
  } catch (error) {
    console.error('Get components failed:', error);
    throw error;
  }
};

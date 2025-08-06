
import { db } from '../db';
import { componentsTable } from '../db/schema';
import { type Component } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function getComponentsByLayer(projectId: number, layer: 'business' | 'data' | 'application' | 'technology'): Promise<Component[]> {
  try {
    const results = await db.select()
      .from(componentsTable)
      .where(and(
        eq(componentsTable.project_id, projectId),
        eq(componentsTable.layer, layer)
      ))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to get components by layer:', error);
    throw error;
  }
}

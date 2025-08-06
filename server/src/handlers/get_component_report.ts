
import { db } from '../db';
import { componentsTable } from '../db/schema';
import { type Component } from '../schema';
import { eq } from 'drizzle-orm';

export async function getComponentReport(projectId: number): Promise<{
  components: Component[];
  summary: {
    total: number;
    by_layer: Record<string, number>;
    by_type: Record<string, number>;
  };
}> {
  try {
    // Fetch all components for the project
    const components = await db.select()
      .from(componentsTable)
      .where(eq(componentsTable.project_id, projectId))
      .execute();

    // Initialize summary counters
    const by_layer: Record<string, number> = {};
    const by_type: Record<string, number> = {};

    // Process each component and build summary statistics
    components.forEach(component => {
      // Count by layer
      by_layer[component.layer] = (by_layer[component.layer] || 0) + 1;
      
      // Count by type
      by_type[component.type] = (by_type[component.type] || 0) + 1;
    });

    return {
      components,
      summary: {
        total: components.length,
        by_layer,
        by_type
      }
    };
  } catch (error) {
    console.error('Component report generation failed:', error);
    throw error;
  }
}

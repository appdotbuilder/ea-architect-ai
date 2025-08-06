
import { db } from '../db';
import { componentsTable, componentRelationshipsTable, artifactsTable, projectsTable } from '../db/schema';
import { type ProjectDashboard } from '../schema';
import { eq, count, desc } from 'drizzle-orm';

export async function getProjectDashboard(projectId: number): Promise<ProjectDashboard> {
  try {
    // Get total components count
    const totalComponentsResult = await db.select({ count: count() })
      .from(componentsTable)
      .where(eq(componentsTable.project_id, projectId))
      .execute();

    const totalComponents = totalComponentsResult[0]?.count || 0;

    // Get components count by layer
    const componentsByLayerResult = await db.select({
      layer: componentsTable.layer,
      count: count()
    })
      .from(componentsTable)
      .where(eq(componentsTable.project_id, projectId))
      .groupBy(componentsTable.layer)
      .execute();

    const componentsByLayer = {
      business: 0,
      data: 0,
      application: 0,
      technology: 0
    };

    componentsByLayerResult.forEach(result => {
      componentsByLayer[result.layer] = result.count;
    });

    // Get total relationships count for components in this project
    const totalRelationshipsResult = await db.select({ count: count() })
      .from(componentRelationshipsTable)
      .innerJoin(componentsTable, eq(componentRelationshipsTable.source_component_id, componentsTable.id))
      .where(eq(componentsTable.project_id, projectId))
      .execute();

    const totalRelationships = totalRelationshipsResult[0]?.count || 0;

    // Get total artifacts count
    const totalArtifactsResult = await db.select({ count: count() })
      .from(artifactsTable)
      .where(eq(artifactsTable.project_id, projectId))
      .execute();

    const totalArtifacts = totalArtifactsResult[0]?.count || 0;

    // Get recent activity - recent components and artifacts (last 10 items)
    const recentComponents = await db.select({
      name: componentsTable.name,
      created_at: componentsTable.created_at
    })
      .from(componentsTable)
      .where(eq(componentsTable.project_id, projectId))
      .orderBy(desc(componentsTable.created_at))
      .limit(5)
      .execute();

    const recentArtifacts = await db.select({
      name: artifactsTable.name,
      created_at: artifactsTable.created_at
    })
      .from(artifactsTable)
      .where(eq(artifactsTable.project_id, projectId))
      .orderBy(desc(artifactsTable.created_at))
      .limit(5)
      .execute();

    // Combine and sort recent activity
    const recentActivity = [
      ...recentComponents.map(comp => ({
        type: 'component_created',
        description: `Component "${comp.name}" was created`,
        timestamp: comp.created_at
      })),
      ...recentArtifacts.map(artifact => ({
        type: 'artifact_uploaded',
        description: `Artifact "${artifact.name}" was uploaded`,
        timestamp: artifact.created_at
      }))
    ]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);

    return {
      project_id: projectId,
      total_components: totalComponents,
      components_by_layer: componentsByLayer,
      total_relationships: totalRelationships,
      total_artifacts: totalArtifacts,
      recent_activity: recentActivity
    };
  } catch (error) {
    console.error('Dashboard generation failed:', error);
    throw error;
  }
}

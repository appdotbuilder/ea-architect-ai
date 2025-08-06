
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Network, Layers, Database, Monitor, Cpu } from 'lucide-react';

import type { 
  Project, 
  User, 
  Component, 
  ComponentRelationship,
  Artifact
} from '../../../server/src/schema';

import { ComponentManagement } from '@/components/ComponentManagement';
import { ArtifactManagement } from '@/components/ArtifactManagement';

interface ProjectViewProps {
  project: Project;
  currentUser: User;
  onBack: () => void;
}

export function ProjectView({ project, currentUser, onBack }: ProjectViewProps) {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [components, setComponents] = useState<Component[]>([]);
  const [relationships, setRelationships] = useState<ComponentRelationship[]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load project data
  const loadProjectData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [
        componentsResult,
        relationshipsResult,
        artifactsResult
      ] = await Promise.all([
        trpc.getComponentsByProject.query(project.id),
        trpc.getRelationshipsByProject.query(project.id),
        trpc.getArtifactsByProject.query(project.id)
      ]);
      
      setComponents(componentsResult);
      setRelationships(relationshipsResult);
      setArtifacts(artifactsResult);
    } catch (error) {
      console.error('Failed to load project data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [project.id]);

  useEffect(() => {
    loadProjectData();
  }, [loadProjectData]);

  // Get layer statistics
  const getLayerStats = useCallback(() => {
    const stats = {
      business: components.filter((c: Component) => c.layer === 'business').length,
      data: components.filter((c: Component) => c.layer === 'data').length,
      application: components.filter((c: Component) => c.layer === 'application').length,
      technology: components.filter((c: Component) => c.layer === 'technology').length,
    };
    return stats;
  }, [components]);

  const layerStats = getLayerStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Projects
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
            <div className="flex items-center space-x-3 mt-1">
              {project.description && (
                <p className="text-gray-600">{project.description}</p>
              )}
              <Badge 
                variant={project.status === 'active' ? 'default' : 'secondary'}
                className={
                  project.status === 'active' ? 'bg-green-100 text-green-800' :
                  project.status === 'inactive' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }
              >
                {project.status}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6 lg:w-fit">
          <TabsTrigger value="overview">📊 Overview</TabsTrigger>
          <TabsTrigger value="business">🏢 Business</TabsTrigger>
          <TabsTrigger value="data">💾 Data</TabsTrigger>
          <TabsTrigger value="application">💻 Application</TabsTrigger>
          <TabsTrigger value="technology">🔧 Technology</TabsTrigger>
          <TabsTrigger value="artifacts">📁 Artifacts</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="overview" className="space-y-6">
            {isLoading ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p>Loading project overview...</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Architecture Layer Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Layers className="w-5 h-5" />
                      Architecture Layer Overview
                    </CardTitle>
                    <CardDescription>
                      Distribution of components across the four architectural layers
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 border rounded-lg bg-blue-50">
                        <div className="w-8 h-8 bg-blue-500 rounded-lg mx-auto mb-2 flex items-center justify-center">
                          <Layers className="w-4 h-4 text-white" />
                        </div>
                        <div className="text-2xl font-bold text-blue-600">{layerStats.business}</div>
                        <div className="text-sm text-gray-600">Business Layer</div>
                        <div className="text-xs text-gray-500 mt-1">Processes, Capabilities, Value Streams</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg bg-green-50">
                        <div className="w-8 h-8 bg-green-500 rounded-lg mx-auto mb-2 flex items-center justify-center">
                          <Database className="w-4 h-4 text-white" />
                        </div>
                        <div className="text-2xl font-bold text-green-600">{layerStats.data}</div>
                        <div className="text-sm text-gray-600">Data Layer</div>
                        <div className="text-xs text-gray-500 mt-1">Data Entities, Data Flows</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg bg-purple-50">
                        <div className="w-8 h-8 bg-purple-500 rounded-lg mx-auto mb-2 flex items-center justify-center">
                          <Monitor className="w-4 h-4 text-white" />
                        </div>
                        <div className="text-2xl font-bold text-purple-600">{layerStats.application}</div>
                        <div className="text-sm text-gray-600">Application Layer</div>
                        <div className="text-xs text-gray-500 mt-1">Applications, Services</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg bg-orange-50">
                        <div className="w-8 h-8 bg-orange-500 rounded-lg mx-auto mb-2 flex items-center justify-center">
                          <Cpu className="w-4 h-4 text-white" />
                        </div>
                        <div className="text-2xl font-bold text-orange-600">{layerStats.technology}</div>
                        <div className="text-sm text-gray-600">Technology Layer</div>
                        <div className="text-xs text-gray-500 mt-1">Infrastructure, Standards</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Components</CardTitle>
                      <Network className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{components.length}</div>
                      <p className="text-xs text-muted-foreground">
                        Across all layers
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Relationships</CardTitle>
                      <Network className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{relationships.length}</div>
                      <p className="text-xs text-muted-foreground">
                        Component connections
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Artifacts</CardTitle>
                      <Network className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{artifacts.length}</div>
                      <p className="text-xs text-muted-foreground">
                        Documents & files
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* EA Framework Guidance */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      🎯 EA Framework Guidance
                    </CardTitle>
                    <CardDescription>
                      Structured approach to enterprise architecture development
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2">🏗️ Architecture Development</h4>
                        <p className="text-sm text-gray-600 mb-3">
                          Follow a structured approach to capture and document your enterprise architecture.
                        </p>
                        <ul className="text-xs space-y-1 text-gray-600">
                          <li>• Start with Business Layer (processes, capabilities)</li>
                          <li>• Define Data Layer (entities, flows)</li>
                          <li>• Map Application Layer (systems, services)</li>
                          <li>• Document Technology Layer (infrastructure)</li>
                        </ul>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2">🔗 Relationship Mapping</h4>
                        <p className="text-sm text-gray-600 mb-3">
                          Establish connections between architectural components.
                        </p>
                        <ul className="text-xs space-y-1 text-gray-600">
                          <li>• Dependencies (A depends on B)</li>
                          <li>• Support relationships (A supports B)</li>
                          <li>• Usage patterns (A uses B)</li>
                          <li>• Implementation links (A implements B)</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="business">
            <ComponentManagement
              projectId={project.id}
              layer="business"
              currentUser={currentUser}
              title="Business Architecture"
              description="Define business processes, capabilities, and value streams"
              onComponentsChange={loadProjectData}
            />
          </TabsContent>

          <TabsContent value="data">
            <ComponentManagement
              projectId={project.id}
              layer="data"
              currentUser={currentUser}
              title="Data Architecture"
              description="Model data entities and data flows"
              onComponentsChange={loadProjectData}
            />
          </TabsContent>

          <TabsContent value="application">
            <ComponentManagement
              projectId={project.id}
              layer="application"
              currentUser={currentUser}
              title="Application Architecture"
              description="Catalog applications and services"
              onComponentsChange={loadProjectData}
            />
          </TabsContent>

          <TabsContent value="technology">
            <ComponentManagement
              projectId={project.id}
              layer="technology"
              currentUser={currentUser}
              title="Technology Architecture"
              description="Document infrastructure components and technology standards"
              onComponentsChange={loadProjectData}
            />
          </TabsContent>

          <TabsContent value="artifacts">
            <ArtifactManagement
              projectId={project.id}
              currentUser={currentUser}
              components={components}
              onArtifactsChange={loadProjectData}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

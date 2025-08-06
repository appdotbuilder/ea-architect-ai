
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { Users, Building2, FolderOpen, Plus, BarChart3, Network } from 'lucide-react';

// Import types from server - using correct relative path (2 levels up)
import type { 
  User, 
  Organization, 
  Project
} from '../../server/src/schema';

// Import components
import { UserManagement } from '@/components/UserManagement';
import { OrganizationManagement } from '@/components/OrganizationManagement';
import { ProjectManagement } from '@/components/ProjectManagement';
import { ProjectView } from '@/components/ProjectView';

function App() {
  // Main navigation state
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  
  // Data states
  const [users, setUsers] = useState<User[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Current user state (in a real app, this would come from authentication)
  const [currentUser] = useState<User>({
    id: 1,
    email: 'admin@eaarchitect.ai',
    name: 'System Administrator',
    role: 'admin',
    organization_id: 1,
    created_at: new Date(),
    updated_at: new Date()
  });

  // Load initial data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [usersResult, orgsResult, projectsResult] = await Promise.all([
        trpc.getUsers.query(),
        trpc.getOrganizations.query(),
        trpc.getProjects.query()
      ]);
      
      setUsers(usersResult);
      setOrganizations(orgsResult);
      setProjects(projectsResult);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle project selection
  const handleProjectSelect = useCallback((project: Project) => {
    setSelectedProject(project);
    setActiveTab('project-view');
  }, []);

  // Handle back to projects
  const handleBackToProjects = useCallback(() => {
    setSelectedProject(null);
    setActiveTab('projects');
  }, []);

  // Refresh projects after creation/update
  const refreshProjects = useCallback(async () => {
    try {
      const projectsResult = await trpc.getProjects.query();
      setProjects(projectsResult);
    } catch (error) {
      console.error('Failed to refresh projects:', error);
    }
  }, []);

  // Get project statistics for dashboard
  const getProjectStats = useCallback(() => {
    const totalProjects = projects.length;
    const activeProjects = projects.filter((p: Project) => p.status === 'active').length;
    const inactiveProjects = projects.filter((p: Project) => p.status === 'inactive').length;
    const archivedProjects = projects.filter((p: Project) => p.status === 'archived').length;

    return {
      total: totalProjects,
      active: activeProjects,
      inactive: inactiveProjects,
      archived: archivedProjects
    };
  }, [projects]);

  const projectStats = getProjectStats();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading EA Architect AI...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Network className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">EA Architect AI</h1>
                <p className="text-sm text-gray-500">Enterprise Architecture Management Platform</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                🟢 Online
              </Badge>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{currentUser.name}</p>
                <p className="text-xs text-gray-500 capitalize">{currentUser.role}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {selectedProject ? (
          <ProjectView
            project={selectedProject}
            currentUser={currentUser}
            onBack={handleBackToProjects}
          />
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-6 lg:w-fit">
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </TabsTrigger>
              <TabsTrigger value="projects" className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4" />
                <span className="hidden sm:inline">Projects</span>
              </TabsTrigger>
              <TabsTrigger value="organizations" className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                <span className="hidden sm:inline">Organizations</span>
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Users</span>
              </TabsTrigger>
              <TabsTrigger value="reports" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Reports</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Settings</span>
              </TabsTrigger>
            </TabsList>

            <div className="mt-6">
              <TabsContent value="dashboard" className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
                    <p className="text-gray-600">Overview of your enterprise architecture projects</p>
                  </div>
                  <Button 
                    onClick={() => setActiveTab('projects')}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Project
                  </Button>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                      <FolderOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{projectStats.total}</div>
                      <p className="text-xs text-muted-foreground">
                        All architecture projects
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
                      <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">{projectStats.active}</div>
                      <p className="text-xs text-muted-foreground">
                        Currently active
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Organizations</CardTitle>
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{organizations.length}</div>
                      <p className="text-xs text-muted-foreground">
                        Registered organizations
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Users</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{users.length}</div>
                      <p className="text-xs text-muted-foreground">
                        Platform users
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Projects */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Projects</CardTitle>
                    <CardDescription>
                      Your latest enterprise architecture projects
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {projects.length === 0 ? (
                      <div className="text-center py-8">
                        <FolderOpen className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No projects</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Get started by creating your first architecture project.
                        </p>
                        <div className="mt-6">
                          <Button
                            onClick={() => setActiveTab('projects')}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Create Project
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {projects.slice(0, 5).map((project: Project) => (
                          <div
                            key={project.id}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                            onClick={() => handleProjectSelect(project)}
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                <FolderOpen className="w-4 h-4 text-blue-600" />
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900">{project.name}</h4>
                                {project.description && (
                                  <p className="text-sm text-gray-500 line-clamp-1">{project.description}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge 
                                variant={project.status === 'active' ? 'default' : 'secondary'}
                                className={
                                  project.status === 'active' ? 'bg-green-100 text-green-800 hover:bg-green-200' :
                                  project.status === 'inactive' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' :
                                  'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                }
                              >
                                {project.status}
                              </Badge>
                              <span className="text-sm text-gray-400">
                                {project.created_at.toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="projects">
                <ProjectManagement
                  projects={projects}
                  organizations={organizations}
                  currentUser={currentUser}
                  onProjectSelect={handleProjectSelect}
                  onProjectsChange={refreshProjects}
                />
              </TabsContent>

              <TabsContent value="organizations">
                <OrganizationManagement
                  organizations={organizations}
                  onOrganizationsChange={loadData}
                />
              </TabsContent>

              <TabsContent value="users">
                <UserManagement
                  users={users}
                  organizations={organizations}
                  onUsersChange={loadData}
                />
              </TabsContent>

              <TabsContent value="reports" className="space-y-6">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">Reports & Analytics</h2>
                  <p className="text-gray-600">Enterprise architecture insights and metrics</p>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>📊 Platform Overview</CardTitle>
                    <CardDescription>
                      High-level metrics across your EA platform
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{projects.length}</div>
                        <div className="text-sm text-gray-600">Total Projects</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{projectStats.active}</div>
                        <div className="text-sm text-gray-600">Active Projects</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">{organizations.length}</div>
                        <div className="text-sm text-gray-600">Organizations</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">{users.length}</div>
                        <div className="text-sm text-gray-600">Users</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>🏗️ Architecture Layers</CardTitle>
                    <CardDescription>
                      Component distribution across architectural layers
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-gray-500">
                      <Network className="mx-auto h-12 w-12 mb-4" />
                      <p>Select a project to view detailed architecture reports</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings" className="space-y-6">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">Settings</h2>
                  <p className="text-gray-600">Configure your EA Architect AI platform</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>🎨 Platform Preferences</CardTitle>
                      <CardDescription>
                        Customize your platform experience
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Dark Mode</label>
                        <Badge variant="outline">Coming Soon</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Email Notifications</label>
                        <Badge variant="outline">Enabled</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Auto-save</label>
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>🔧 System Information</CardTitle>
                      <CardDescription>
                        Platform status and version information
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Version</span>
                        <Badge variant="outline">v1.0.0</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Status</span>
                        <Badge className="bg-green-100 text-green-800">🟢 Operational</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Last Updated</span>
                        <span className="text-sm text-gray-600">Just now</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        )}
      </main>
    </div>
  );
}

export default App;

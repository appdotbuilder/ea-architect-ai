
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { FolderOpen, Users, Building2, BarChart3 } from 'lucide-react';
import type { Project, User, Organization } from '../../../server/src/schema';

interface DashboardProps {
  projects: Project[];
  users: User[];
  organizations: Organization[];
}

export function Dashboard({ projects, users, organizations }: DashboardProps) {
  // Calculate statistics
  const totalProjects = projects.length;
  const activeProjects = projects.filter((p: Project) => p.status === 'active').length;
  const inactiveProjects = projects.filter((p: Project) => p.status === 'inactive').length;
  const archivedProjects = projects.filter((p: Project) => p.status === 'archived').length;

  const activePercentage = totalProjects > 0 ? (activeProjects / totalProjects) * 100 : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">EA Platform Dashboard</h2>
        <p className="text-gray-600">Overview of your enterprise architecture management platform</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProjects}</div>
            <p className="text-xs text-muted-foreground">
              Enterprise architecture projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeProjects}</div>
            <p className="text-xs text-muted-foreground">
              Currently in development
            </p>
            {totalProjects > 0 && (
              <Progress value={activePercentage} className="mt-2" />
            )}
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
            <CardTitle className="text-sm font-medium">Platform Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">
              Active EA practitioners
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Project Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Project Status Distribution</CardTitle>
            <CardDescription>
              Current status of all EA projects
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm">Active</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">{activeProjects}</span>
                <Badge className="bg-green-100 text-green-800">
                  {totalProjects > 0 ? Math.round(activePercentage) : 0}%
                </Badge>
              </div>
            </div>
            <Progress value={activePercentage} className="h-2" />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm">Inactive</span>
              </div>
              <span className="text-sm font-medium">{inactiveProjects}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                <span className="text-sm">Archived</span>
              </div>
              <span className="text-sm font-medium">{archivedProjects}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Platform Activity</CardTitle>
            <CardDescription>
              Recent activity across the EA platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            {totalProjects === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="mx-auto h-8 w-8 mb-2 text-gray-400" />
                <p className="text-sm">No activity yet</p>
                <p className="text-xs">Create your first project to see activity</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-sm">
                  <FolderOpen className="w-4 h-4 text-blue-500" />
                  <span className="text-gray-600">
                    {totalProjects} project{totalProjects !== 1 ? 's' : ''} created
                  </span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <Building2 className="w-4 h-4 text-purple-500" />
                  <span className="text-gray-600">
                    {organizations.length} organization{organizations.length !== 1 ? 's' : ''} registered
                  </span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <Users className="w-4 h-4 text-green-500" />
                  <span className="text-gray-600">
                    {users.length} user{users.length !== 1 ? 's' : ''} active
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* EA Framework Guidance */}
      <Card>
        <CardHeader>
          <CardTitle>🎯 Enterprise Architecture Framework Guidance</CardTitle>
          <CardDescription>
            Follow these structured phases for comprehensive EA development
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600">1</div>
                <h4 className="font-medium">Business Architecture</h4>
              </div>
              <p className="text-sm text-gray-600 mb-2">Define business strategy and processes</p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>• Business Processes</li>
                <li>• Capabilities</li>
                <li>• Value Streams</li>
              </ul>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-xs font-bold text-green-600">2</div>
                <h4 className="font-medium">Data Architecture</h4>
              </div>
              <p className="text-sm text-gray-600 mb-2">Model information and data flows</p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>• Data Entities</li>
                <li>• Data Flows</li>
                <li>• Data Models</li>
              </ul>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-xs font-bold text-purple-600">3</div>
                <h4 className="font-medium">Application Architecture</h4>
              </div>
              <p className="text-sm text-gray-600 mb-2">Design systems and services</p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>• Applications</li>
                <li>• Services</li>
                <li>• Integrations</li>
              </ul>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center text-xs font-bold text-orange-600">4</div>
                <h4 className="font-medium">Technology Architecture</h4>
              </div>
              <p className="text-sm text-gray-600 mb-2">Plan infrastructure and standards</p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>• Infrastructure</li>
                <li>• Technology Standards</li>
                <li>• Platforms</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

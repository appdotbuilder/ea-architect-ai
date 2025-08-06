
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { trpc } from '@/utils/trpc';
import { useState } from 'react';
import { FolderOpen, Plus, Trash2, Edit, Building2, User, Calendar } from 'lucide-react';
import type { Project, Organization, User as UserType, CreateProjectInput } from '../../../server/src/schema';

interface ProjectManagementProps {
  projects: Project[];
  organizations: Organization[];
  currentUser: UserType;
  onProjectSelect: (project: Project) => void;
  onProjectsChange: () => void;
}

export function ProjectManagement({ 
  projects, 
  organizations, 
  currentUser, 
  onProjectSelect, 
  onProjectsChange 
}: ProjectManagementProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateProjectInput>({
    name: '',
    description: null,
    organization_id: currentUser.organization_id || 1,
    created_by: currentUser.id
  });

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await trpc.createProject.mutate(formData);
      onProjectsChange();
      setFormData({
        name: '',
        description: null,
        organization_id: currentUser.organization_id || 1,
        created_by: currentUser.id
      });
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create project:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProject = async (projectId: number) => {
    try {
      await trpc.deleteProject.mutate(projectId);
      onProjectsChange();
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
  };

  const getOrganizationName = (orgId: number) => {
    const org = organizations.find((o: Organization) => o.id === orgId);
    return org?.name || 'Unknown Organization';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Project Management</h2>
          <p className="text-gray-600">Create and manage enterprise architecture projects</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>🚀 Create New EA Project</DialogTitle>
              <DialogDescription>
                Start a new enterprise architecture project with structured guidance
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateProjectInput) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g., Digital Transformation 2024"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData((prev: CreateProjectInput) => ({ 
                      ...prev, 
                      description: e.target.value || null 
                    }))
                  }
                  placeholder="Describe the scope and objectives of this EA project..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="organization">Organization</Label>
                <Select 
                  value={formData.organization_id.toString()} 
                  onValueChange={(value: string) =>
                    setFormData((prev: CreateProjectInput) => ({ 
                      ...prev, 
                      organization_id: parseInt(value) 
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select organization" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map((org: Organization) => (
                      <SelectItem key={org.id} value={org.id.toString()}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">🎯 EA Framework Guidance</h4>
                <p className="text-sm text-blue-700">
                  Your new project will include structured templates for all four architectural layers:
                  Business, Data, Application, and Technology. Follow the guided prompts to ensure
                  comprehensive coverage of your enterprise architecture.
                </p>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Create Project'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FolderOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
            <p className="text-gray-500 mb-6">Start your enterprise architecture journey by creating your first project.</p>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create First Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {projects.map((project: Project) => (
            <Card 
              key={project.id} 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => onProjectSelect(project)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                      <FolderOpen className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl hover:text-blue-600 transition-colors">
                        {project.name}
                      </CardTitle>
                      {project.description && (
                        <CardDescription className="mt-1">
                          {project.description}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                    <Badge 
                      variant={project.status === 'active' ? 'default' : 'secondary'}
                      className={
                        project.status === 'active' ? 'bg-green-100 text-green-800 hover:bg-green-200' :
                        project.status === 'inactive' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' :
                        'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }
                    >
                      {project.status === 'active' ? '🟢 Active' :
                       project.status === 'inactive' ? '🟡 Inactive' :
                       '🔴 Archived'}
                    </Badge>
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Project</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{project.name}"? This will permanently remove all components, relationships, and artifacts. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteProject(project.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete Project
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {getOrganizationName(project.organization_id)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Created by User {project.created_by}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {project.created_at.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    Click to explore →
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

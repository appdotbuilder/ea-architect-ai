
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { trpc } from '@/utils/trpc';
import { useState } from 'react';
import { Building2, Plus, Trash2, Edit, Users } from 'lucide-react';
import type { Organization, CreateOrganizationInput } from '../../../server/src/schema';

interface OrganizationManagementProps {
  organizations: Organization[];
  onOrganizationsChange: () => void;
}

export function OrganizationManagement({ organizations, onOrganizationsChange }: OrganizationManagementProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateOrganizationInput>({
    name: '',
    description: null
  });

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await trpc.createOrganization.mutate(formData);
      onOrganizationsChange();
      setFormData({
        name: '',
        description: null
      });
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create organization:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteOrganization = async (organizationId: number) => {
    try {
      await trpc.deleteOrganization.mutate(organizationId);
      onOrganizationsChange();
    } catch (error) {
      console.error('Failed to delete organization:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Organization Management</h2>
          <p className="text-gray-600">Manage organizations and their enterprise architecture projects</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Organization
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Organization</DialogTitle>
              <DialogDescription>
                Add a new organization to manage EA projects
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateOrganization} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Organization Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateOrganizationInput) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Enter organization name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData((prev: CreateOrganizationInput) => ({ 
                      ...prev, 
                      description: e.target.value || null 
                    }))
                  }
                  placeholder="Enter organization description"
                  rows={3}
                />
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
                  {isLoading ? 'Creating...' : 'Create Organization'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {organizations.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Building2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No organizations found</h3>
            <p className="text-gray-500 mb-6">Create your first organization to get started with enterprise architecture management.</p>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Organization
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {organizations.map((organization: Organization) => (
            <Card key={organization.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{organization.name}</CardTitle>
                      {organization.description && (
                        <CardDescription className="mt-1">
                          {organization.description}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
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
                          <AlertDialogTitle>Delete Organization</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete {organization.name}? This will also delete all associated projects and data. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteOrganization(organization.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
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
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Members: Coming Soon</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Projects: Coming Soon</span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    Created: {organization.created_at.toLocaleDateString()}
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

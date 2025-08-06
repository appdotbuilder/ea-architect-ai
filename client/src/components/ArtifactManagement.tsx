
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
import { useState, useEffect, useCallback } from 'react';
import { FileText, Upload, Trash2, Download, File, Image, Archive, Video } from 'lucide-react';

import type { 
  Artifact, 
  Component,
  User, 
  CreateArtifactInput
} from '../../../server/src/schema';

interface ArtifactManagementProps {
  projectId: number;
  currentUser: User;
  components: Component[];
  onArtifactsChange: () => void;
}

export function ArtifactManagement({ 
  projectId, 
  currentUser, 
  components,
  onArtifactsChange 
}: ArtifactManagementProps) {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form data - simulated file data since file upload isn't fully implemented
  const [formData, setFormData] = useState<CreateArtifactInput>({
    name: '',
    description: null,
    file_path: '',
    file_type: '',
    file_size: 0,
    component_id: null,
    project_id: projectId,
    uploaded_by: currentUser.id
  });

  // Load artifacts
  const loadArtifacts = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await trpc.getArtifactsByProject.query(projectId);
      setArtifacts(result);
    } catch (error) {
      console.error('Failed to load artifacts:', error);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadArtifacts();
  }, [loadArtifacts]);

  // Handle create artifact
  const handleCreateArtifact = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Simulated file upload - in a real implementation, this would handle actual file upload
      const simulatedArtifact: CreateArtifactInput = {
        ...formData,
        file_path: `/uploads/${formData.name.replace(/\s+/g, '_').toLowerCase()}`,
        file_type: getFileTypeFromName(formData.name),
        file_size: Math.floor(Math.random() * 1000000) + 50000 // Random size between 50KB-1MB
      };
      
      await trpc.createArtifact.mutate(simulatedArtifact);
      await loadArtifacts();
      onArtifactsChange();
      
      setFormData({
        name: '',
        description: null,
        file_path: '',
        file_type: '',
        file_size: 0,
        component_id: null,
        project_id: projectId,
        uploaded_by: currentUser.id
      });
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create artifact:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete artifact
  const handleDeleteArtifact = async (artifactId: number) => {
    try {
      await trpc.deleteArtifact.mutate(artifactId);
      await loadArtifacts();
      onArtifactsChange();
    } catch (error) {
      console.error('Failed to delete artifact:', error);
    }
  };

  // Get file type from name (simulation helper)
  const getFileTypeFromName = (name: string): string => {
    const extension = name.split('.').pop()?.toLowerCase() || '';
    const typeMap: Record<string, string> = {
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'zip': 'application/zip',
      'txt': 'text/plain'
    };
    return typeMap[extension] || 'application/octet-stream';
  };

  // Get file icon
  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className="w-5 h-5 text-blue-500" />;
    if (fileType.includes('pdf')) return <File className="w-5 h-5 text-red-500" />;
    if (fileType.includes('zip') || fileType.includes('archive')) return <Archive className="w-5 h-5 text-purple-500" />;
    if (fileType.startsWith('video/')) return <Video className="w-5 h-5 text-green-500" />;
    return <FileText className="w-5 h-5 text-gray-500" />;
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get component name
  const getComponentName = (componentId: number | null): string => {
    if (!componentId) return 'Unassigned';
    const component = components.find((c: Component) => c.id === componentId);
    return component ? component.name : 'Unknown Component';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FileText className="w-8 h-8" />
            Artifact Management
          </h2>
          <p className="text-gray-600">Upload and manage documents, diagrams, and files for your project</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
              <Upload className="w-4 h-4 mr-2" />
              Upload Artifact
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>📁 Upload New Artifact</DialogTitle>
              <DialogDescription>
                Add documents, diagrams, or other files to your project
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateArtifact} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">File Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateArtifactInput) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g., Business Process Diagram.pdf"
                  required
                />
                <p className="text-xs text-gray-500">
                  📝 Note: This is a simulation. In production, you would upload an actual file here.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData((prev: CreateArtifactInput) => ({ 
                      ...prev, 
                      description: e.target.value || null 
                    }))
                  }
                  placeholder="Describe what this artifact contains..."
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Associate with Component (Optional)</Label>
                <Select 
                  value={formData.component_id?.toString() || 'unassigned'} 
                  onValueChange={(value: string) =>
                    setFormData((prev: CreateArtifactInput) => ({ 
                      ...prev, 
                      component_id: value === 'unassigned' ? null : parseInt(value) 
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select component (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">No specific component</SelectItem>
                    {components.map((component: Component) => (
                      <SelectItem key={component.id} value={component.id.toString()}>
                        {component.name} ({component.layer})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">💡 Artifact Types</h4>
                <div className="text-sm text-blue-700 space-y-1">
                  <p>• <strong>Diagrams:</strong> Process flows, architecture diagrams, network maps</p>
                  <p>• <strong>Documents:</strong> Requirements, specifications, policies</p>
                  <p>• <strong>Spreadsheets:</strong> Data inventories, component matrices</p>
                  <p>• <strong>Images:</strong> Screenshots, photos, mockups</p>
                </div>
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
                  {isLoading ? 'Creating...' : 'Create Artifact'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading && artifacts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading artifacts...</p>
          </CardContent>
        </Card>
      ) : artifacts.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No artifacts uploaded</h3>
            <p className="text-gray-500 mb-6">
              Start by uploading documents, diagrams, or other files related to your project.
            </p>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload First Artifact
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {artifacts.map((artifact: Artifact) => (
            <Card key={artifact.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="p-2 bg-gray-50 rounded-lg">
                      {getFileIcon(artifact.file_type)}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">{artifact.name}</h3>
                      {artifact.description && (
                        <p className="text-sm text-gray-600 mt-1">{artifact.description}</p>
                      )}
                      <div className="flex items-center space-x-4 mt-2">
                        <Badge variant="outline">
                          {formatFileSize(artifact.file_size)}
                        </Badge>
                        <Badge variant="secondary">
                          {getComponentName(artifact.component_id)}
                        </Badge>
                        <span className="text-xs text-gray-400">
                          Uploaded: {artifact.created_at.toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" disabled>
                      <Download className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Artifact</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{artifact.name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteArtifact(artifact.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                <div className="mt-4 text-xs text-gray-400">
                  Path: {artifact.file_path} • Type: {artifact.file_type}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Artifact Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle>📚 Artifact Management Guidelines</CardTitle>
          <CardDescription>
            Best practices for organizing your EA artifacts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">🎯 Recommended Artifacts by Layer</h4>
              <div className="space-y-3 text-sm">
                <div>
                  <strong className="text-blue-600">Business Layer:</strong>
                  <ul className="list-disc list-inside text-gray-600 mt-1">
                    <li>Process flow diagrams</li>
                    <li>Capability maps</li>
                    <li>Value stream maps</li>
                    <li>Business requirements</li>
                  </ul>
                </div>
                <div>
                  <strong className="text-green-600">Data Layer:</strong>
                  <ul className="list-disc list-inside text-gray-600 mt-1">
                    <li>Data models (ERD, logical)</li>
                    <li>Data flow diagrams</li>
                    <li>Data dictionaries</li>
                    <li>Integration schemas</li>
                  </ul>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-3">💻 Application & Technology</h4>
              <div className="space-y-3 text-sm">
                <div>
                  <strong className="text-purple-600">Application Layer:</strong>
                  <ul className="list-disc list-inside text-gray-600 mt-1">
                    <li>Application portfolio</li>
                    <li>Service catalogs</li>
                    <li>API specifications</li>
                    <li>Integration patterns</li>
                  </ul>
                </div>
                <div>
                  <strong className="text-orange-600">Technology Layer:</strong>
                  <ul className="list-disc list-inside text-gray-600 mt-1">
                    <li>Infrastructure diagrams</li>
                    <li>Network topology</li>
                    <li>Technology standards</li>
                    <li>Security policies</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

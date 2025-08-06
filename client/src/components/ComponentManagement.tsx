
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Edit, Network, Layers, Database, Monitor, Cpu } from 'lucide-react';

import type { 
  Component, 
  User, 
  CreateComponentInput,
  ComponentRelationship,
  CreateComponentRelationshipInput
} from '../../../server/src/schema';

interface ComponentManagementProps {
  projectId: number;
  layer: 'business' | 'data' | 'application' | 'technology';
  currentUser: User;
  title: string;
  description: string;
  onComponentsChange: () => void;
}

export function ComponentManagement({ 
  projectId, 
  layer, 
  currentUser, 
  title, 
  description,
  onComponentsChange 
}: ComponentManagementProps) {
  const [components, setComponents] = useState<Component[]>([]);
  const [relationships, setRelationships] = useState<ComponentRelationship[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isRelationshipDialogOpen, setIsRelationshipDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [allProjectComponents, setAllProjectComponents] = useState<Component[]>([]);

  // Component form data
  const [componentFormData, setComponentFormData] = useState<CreateComponentInput>({
    name: '',
    description: null,
    type: getDefaultComponentType(layer),
    layer: layer,
    project_id: projectId,
    created_by: currentUser.id,
    metadata: null
  });

  // Relationship form data
  const [relationshipFormData, setRelationshipFormData] = useState<CreateComponentRelationshipInput>({
    source_component_id: 0,
    target_component_id: 0,
    relationship_type: 'depends_on',
    description: null,
    created_by: currentUser.id
  });

  // Get default component type for layer
  function getDefaultComponentType(layer: string) {
    switch (layer) {
      case 'business': return 'business_process' as const;
      case 'data': return 'data_entity' as const;
      case 'application': return 'application' as const;
      case 'technology': return 'infrastructure_component' as const;
      default: return 'business_process' as const;
    }
  }

  // Get component types for layer
  const getComponentTypesForLayer = useCallback((layer: string) => {
    switch (layer) {
      case 'business':
        return [
          { value: 'business_process', label: '🔄 Business Process' },
          { value: 'capability', label: '🎯 Capability' },
          { value: 'value_stream', label: '💰 Value Stream' }
        ];
      case 'data':
        return [
          { value: 'data_entity', label: '📊 Data Entity' },
          { value: 'data_flow', label: '🔄 Data Flow' }
        ];
      case 'application':
        return [
          { value: 'application', label: '💻 Application' },
          { value: 'service', label: '🔌 Service' }
        ];
      case 'technology':
        return [
          { value: 'infrastructure_component', label: '🖥️ Infrastructure Component' },
          { value: 'technology_standard', label: '📋 Technology Standard' }
        ];
      default:
        return [];
    }
  }, []);

  // Load components for this layer
  const loadComponents = useCallback(async () => {
    setIsLoading(true);
    try {
      const [layerComponents, projectRelationships, allComponents] = await Promise.all([
        trpc.getComponentsByLayer.query({ projectId, layer }),
        trpc.getRelationshipsByProject.query(projectId),
        trpc.getComponentsByProject.query(projectId)
      ]);
      
      setComponents(layerComponents);
      setRelationships(projectRelationships);
      setAllProjectComponents(allComponents);
    } catch (error) {
      console.error('Failed to load components:', error);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, layer]);

  useEffect(() => {
    loadComponents();
  }, [loadComponents]);

  // Create component
  const handleCreateComponent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await trpc.createComponent.mutate(componentFormData);
      await loadComponents();
      onComponentsChange();
      setComponentFormData({
        name: '',
        description: null,
        type: getDefaultComponentType(layer),
        layer: layer,
        project_id: projectId,
        created_by: currentUser.id,
        metadata: null
      });
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create component:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Create relationship
  const handleCreateRelationship = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await trpc.createComponentRelationship.mutate(relationshipFormData);
      await loadComponents();
      onComponentsChange();
      setRelationshipFormData({
        source_component_id: 0,
        target_component_id: 0,
        relationship_type: 'depends_on',
        description: null,
        created_by: currentUser.id
      });
      setIsRelationshipDialogOpen(false);
    } catch (error) {
      console.error('Failed to create relationship:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete component
  const handleDeleteComponent = async (componentId: number) => {
    try {
      await trpc.deleteComponent.mutate(componentId);
      await loadComponents();
      onComponentsChange();
    } catch (error) {
      console.error('Failed to delete component:', error);
    }
  };

  // Get icon for layer
  const getLayerIcon = useCallback(() => {
    switch (layer) {
      case 'business': return <Layers className="w-5 h-5" />;
      case 'data': return <Database className="w-5 h-5" />;
      case 'application': return <Monitor className="w-5 h-5" />;
      case 'technology': return <Cpu className="w-5 h-5" />;
      default: return <Network className="w-5 h-5" />;
    }
  }, [layer]);

  // Get component relationships
  const getComponentRelationships = useCallback((componentId: number) => {
    return relationships.filter((r: ComponentRelationship) => 
      r.source_component_id === componentId || r.target_component_id === componentId
    );
  }, [relationships]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            {getLayerIcon()}
            {title}
          </h2>
          <p className="text-gray-600">{description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isRelationshipDialogOpen} onOpenChange={setIsRelationshipDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Network className="w-4 h-4 mr-2" />
                Add Relationship
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>🔗 Create Component Relationship</DialogTitle>
                <DialogDescription>
                  Define connections between architectural components
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateRelationship} className="space-y-4">
                <div className="space-y-2">
                  <Label>Source Component</Label>
                  <Select 
                    value={relationshipFormData.source_component_id.toString() || 'none'} 
                    onValueChange={(value: string) =>
                      setRelationshipFormData((prev: CreateComponentRelationshipInput) => ({ 
                        ...prev, 
                        source_component_id: value === 'none' ? 0 : parseInt(value) 
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select source component" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Select source component</SelectItem>
                      {allProjectComponents.map((component: Component) => (
                        <SelectItem key={component.id} value={component.id.toString()}>
                          {component.name} ({component.layer})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Relationship Type</Label>
                  <Select 
                    value={relationshipFormData.relationship_type} 
                    onValueChange={(value: 'depends_on' | 'supports' | 'uses' | 'implements' | 'flows_to') =>
                      setRelationshipFormData((prev: CreateComponentRelationshipInput) => ({ 
                        ...prev, 
                        relationship_type: value 
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="depends_on">📌 Depends On</SelectItem>
                      <SelectItem value="supports">🤝 Supports</SelectItem>
                      <SelectItem value="uses">🔧 Uses</SelectItem>
                      <SelectItem value="implements">⚙️ Implements</SelectItem>
                      <SelectItem value="flows_to">➡️ Flows To</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Target Component</Label>
                  <Select 
                    value={relationshipFormData.target_component_id.toString() || 'none'} 
                    onValueChange={(value: string) =>
                      setRelationshipFormData((prev: CreateComponentRelationshipInput) => ({ 
                        ...prev, 
                        target_component_id: value === 'none' ? 0 : parseInt(value) 
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select target component" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Select target component</SelectItem>
                      {allProjectComponents.map((component: Component) => (
                        <SelectItem key={component.id} value={component.id.toString()}>
                          {component.name} ({component.layer})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Description (Optional)</Label>
                  <Textarea
                    value={relationshipFormData.description || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setRelationshipFormData((prev: CreateComponentRelationshipInput) => ({ 
                        ...prev, 
                        description: e.target.value || null 
                      }))
                    }
                    placeholder="Describe the relationship..."
                    rows={2}
                  />
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsRelationshipDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Creating...' : 'Create Relationship'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Component
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>✨ Create {title} Component</DialogTitle>
                <DialogDescription>
                  Add a new component to your {layer} architecture layer
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateComponent} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Component Name</Label>
                  <Input
                    id="name"
                    value={componentFormData.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setComponentFormData((prev: CreateComponentInput) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Enter component name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Component Type</Label>
                  <Select 
                    value={componentFormData.type} 
                    onValueChange={(value: CreateComponentInput['type']) =>
                      setComponentFormData((prev: CreateComponentInput) => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {getComponentTypesForLayer(layer).map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={componentFormData.description || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setComponentFormData((prev: CreateComponentInput) => ({ 
                        ...prev, 
                        description: e.target.value || null 
                      }))
                    }
                    placeholder="Describe this component..."
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
                    {isLoading ? 'Creating...' : 'Create Component'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading && components.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading components...</p>
          </CardContent>
        </Card>
      ) : components.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            {getLayerIcon()}
            <h3 className="text-lg font-medium text-gray-900 mb-2 mt-4">No {layer} components yet</h3>
            <p className="text-gray-500 mb-6">Start building your {layer} architecture by adding your first component.</p>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add First Component
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {components.map((component: Component) => {
            const componentRelationships = getComponentRelationships(component.id);
            return (
              <Card key={component.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {getLayerIcon()}
                        {component.name}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline">
                          {component.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Badge>
                        <Badge variant="secondary" className="capitalize">
                          {component.layer}
                        </Badge>
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
                            <AlertDialogTitle>Delete Component</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{component.name}"? This will also remove all associated relationships and artifacts.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteComponent(component.id)}
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
                  {component.description && (
                    <p className="text-gray-600 mb-4">{component.description}</p>
                  )}
                  
                  {componentRelationships.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-900">Relationships:</h4>
                      <div className="flex flex-wrap gap-2">
                        {componentRelationships.map((rel: ComponentRelationship) => (
                          <Badge key={rel.id} variant="outline" className="text-xs">
                            {rel.source_component_id === component.id ? '→' : '←'} {rel.relationship_type}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-4 text-xs text-gray-400">
                    Created: {component.created_at.toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

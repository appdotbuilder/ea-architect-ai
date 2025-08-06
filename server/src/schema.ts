
import { z } from 'zod';

// User schemas
export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  name: z.string(),
  role: z.enum(['admin', 'member']),
  organization_id: z.number().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

export const createUserInputSchema = z.object({
  email: z.string().email(),
  name: z.string(),
  role: z.enum(['admin', 'member']),
  organization_id: z.number().optional()
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const updateUserInputSchema = z.object({
  id: z.number(),
  email: z.string().email().optional(),
  name: z.string().optional(),
  role: z.enum(['admin', 'member']).optional(),
  organization_id: z.number().nullable().optional()
});

export type UpdateUserInput = z.infer<typeof updateUserInputSchema>;

// Organization schemas
export const organizationSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Organization = z.infer<typeof organizationSchema>;

export const createOrganizationInputSchema = z.object({
  name: z.string(),
  description: z.string().nullable().optional()
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationInputSchema>;

export const updateOrganizationInputSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  description: z.string().nullable().optional()
});

export type UpdateOrganizationInput = z.infer<typeof updateOrganizationInputSchema>;

// Project schemas
export const projectSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  organization_id: z.number(),
  created_by: z.number(),
  status: z.enum(['active', 'inactive', 'archived']),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Project = z.infer<typeof projectSchema>;

export const createProjectInputSchema = z.object({
  name: z.string(),
  description: z.string().nullable().optional(),
  organization_id: z.number(),
  created_by: z.number()
});

export type CreateProjectInput = z.infer<typeof createProjectInputSchema>;

export const updateProjectInputSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  description: z.string().nullable().optional(),
  status: z.enum(['active', 'inactive', 'archived']).optional()
});

export type UpdateProjectInput = z.infer<typeof updateProjectInputSchema>;

// Architectural Component schemas
export const componentSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  type: z.enum([
    'business_process', 'capability', 'value_stream',
    'data_entity', 'data_flow',
    'application', 'service',
    'infrastructure_component', 'technology_standard'
  ]),
  layer: z.enum(['business', 'data', 'application', 'technology']),
  project_id: z.number(),
  created_by: z.number(),
  metadata: z.string().nullable(), // JSON string for flexible component-specific data
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Component = z.infer<typeof componentSchema>;

export const createComponentInputSchema = z.object({
  name: z.string(),
  description: z.string().nullable().optional(),
  type: z.enum([
    'business_process', 'capability', 'value_stream',
    'data_entity', 'data_flow',
    'application', 'service',
    'infrastructure_component', 'technology_standard'
  ]),
  layer: z.enum(['business', 'data', 'application', 'technology']),
  project_id: z.number(),
  created_by: z.number(),
  metadata: z.string().nullable().optional()
});

export type CreateComponentInput = z.infer<typeof createComponentInputSchema>;

export const updateComponentInputSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  description: z.string().nullable().optional(),
  metadata: z.string().nullable().optional()
});

export type UpdateComponentInput = z.infer<typeof updateComponentInputSchema>;

// Component Relationship schemas
export const componentRelationshipSchema = z.object({
  id: z.number(),
  source_component_id: z.number(),
  target_component_id: z.number(),
  relationship_type: z.enum(['depends_on', 'supports', 'uses', 'implements', 'flows_to']),
  description: z.string().nullable(),
  created_by: z.number(),
  created_at: z.coerce.date()
});

export type ComponentRelationship = z.infer<typeof componentRelationshipSchema>;

export const createComponentRelationshipInputSchema = z.object({
  source_component_id: z.number(),
  target_component_id: z.number(),
  relationship_type: z.enum(['depends_on', 'supports', 'uses', 'implements', 'flows_to']),
  description: z.string().nullable().optional(),
  created_by: z.number()
});

export type CreateComponentRelationshipInput = z.infer<typeof createComponentRelationshipInputSchema>;

// Artifact schemas
export const artifactSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  file_path: z.string(),
  file_type: z.string(),
  file_size: z.number(),
  component_id: z.number().nullable(),
  project_id: z.number(),
  uploaded_by: z.number(),
  created_at: z.coerce.date()
});

export type Artifact = z.infer<typeof artifactSchema>;

export const createArtifactInputSchema = z.object({
  name: z.string(),
  description: z.string().nullable().optional(),
  file_path: z.string(),
  file_type: z.string(),
  file_size: z.number(),
  component_id: z.number().nullable().optional(),
  project_id: z.number(),
  uploaded_by: z.number()
});

export type CreateArtifactInput = z.infer<typeof createArtifactInputSchema>;

// Project Member schemas
export const projectMemberSchema = z.object({
  id: z.number(),
  project_id: z.number(),
  user_id: z.number(),
  role: z.enum(['owner', 'editor', 'viewer']),
  added_by: z.number(),
  created_at: z.coerce.date()
});

export type ProjectMember = z.infer<typeof projectMemberSchema>;

export const createProjectMemberInputSchema = z.object({
  project_id: z.number(),
  user_id: z.number(),
  role: z.enum(['owner', 'editor', 'viewer']),
  added_by: z.number()
});

export type CreateProjectMemberInput = z.infer<typeof createProjectMemberInputSchema>;

// Dashboard and reporting schemas
export const projectDashboardSchema = z.object({
  project_id: z.number(),
  total_components: z.number(),
  components_by_layer: z.record(z.string(), z.number()),
  total_relationships: z.number(),
  total_artifacts: z.number(),
  recent_activity: z.array(z.object({
    type: z.string(),
    description: z.string(),
    timestamp: z.coerce.date()
  }))
});

export type ProjectDashboard = z.infer<typeof projectDashboardSchema>;

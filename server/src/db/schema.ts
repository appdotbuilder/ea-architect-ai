
import { 
  serial, 
  text, 
  pgTable, 
  timestamp, 
  integer, 
  pgEnum,
  jsonb
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'member']);
export const projectStatusEnum = pgEnum('project_status', ['active', 'inactive', 'archived']);
export const componentTypeEnum = pgEnum('component_type', [
  'business_process', 'capability', 'value_stream',
  'data_entity', 'data_flow',
  'application', 'service',
  'infrastructure_component', 'technology_standard'
]);
export const componentLayerEnum = pgEnum('component_layer', ['business', 'data', 'application', 'technology']);
export const relationshipTypeEnum = pgEnum('relationship_type', ['depends_on', 'supports', 'uses', 'implements', 'flows_to']);
export const projectMemberRoleEnum = pgEnum('project_member_role', ['owner', 'editor', 'viewer']);

// Tables
export const organizationsTable = pgTable('organizations', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  role: userRoleEnum('role').notNull(),
  organization_id: integer('organization_id'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

export const projectsTable = pgTable('projects', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  organization_id: integer('organization_id').notNull(),
  created_by: integer('created_by').notNull(),
  status: projectStatusEnum('status').default('active').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

export const componentsTable = pgTable('components', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  type: componentTypeEnum('type').notNull(),
  layer: componentLayerEnum('layer').notNull(),
  project_id: integer('project_id').notNull(),
  created_by: integer('created_by').notNull(),
  metadata: text('metadata'), // JSON string for flexible component-specific data
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

export const componentRelationshipsTable = pgTable('component_relationships', {
  id: serial('id').primaryKey(),
  source_component_id: integer('source_component_id').notNull(),
  target_component_id: integer('target_component_id').notNull(),
  relationship_type: relationshipTypeEnum('relationship_type').notNull(),
  description: text('description'),
  created_by: integer('created_by').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
});

export const artifactsTable = pgTable('artifacts', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  file_path: text('file_path').notNull(),
  file_type: text('file_type').notNull(),
  file_size: integer('file_size').notNull(),
  component_id: integer('component_id'),
  project_id: integer('project_id').notNull(),
  uploaded_by: integer('uploaded_by').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
});

export const projectMembersTable = pgTable('project_members', {
  id: serial('id').primaryKey(),
  project_id: integer('project_id').notNull(),
  user_id: integer('user_id').notNull(),
  role: projectMemberRoleEnum('role').notNull(),
  added_by: integer('added_by').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Relations
export const organizationsRelations = relations(organizationsTable, ({ many, one }) => ({
  users: many(usersTable),
  projects: many(projectsTable)
}));

export const usersRelations = relations(usersTable, ({ one, many }) => ({
  organization: one(organizationsTable, {
    fields: [usersTable.organization_id],
    references: [organizationsTable.id]
  }),
  createdProjects: many(projectsTable, { relationName: 'projectCreator' }),
  createdComponents: many(componentsTable, { relationName: 'componentCreator' }),
  createdRelationships: many(componentRelationshipsTable, { relationName: 'relationshipCreator' }),
  uploadedArtifacts: many(artifactsTable, { relationName: 'artifactUploader' }),
  projectMemberships: many(projectMembersTable, { relationName: 'userMemberships' }),
  addedMembers: many(projectMembersTable, { relationName: 'memberAdder' })
}));

export const projectsRelations = relations(projectsTable, ({ one, many }) => ({
  organization: one(organizationsTable, {
    fields: [projectsTable.organization_id],
    references: [organizationsTable.id]
  }),
  creator: one(usersTable, {
    fields: [projectsTable.created_by],
    references: [usersTable.id],
    relationName: 'projectCreator'
  }),
  components: many(componentsTable),
  artifacts: many(artifactsTable),
  members: many(projectMembersTable)
}));

export const componentsRelations = relations(componentsTable, ({ one, many }) => ({
  project: one(projectsTable, {
    fields: [componentsTable.project_id],
    references: [projectsTable.id]
  }),
  creator: one(usersTable, {
    fields: [componentsTable.created_by],
    references: [usersTable.id],
    relationName: 'componentCreator'
  }),
  artifacts: many(artifactsTable),
  sourceRelationships: many(componentRelationshipsTable, { relationName: 'sourceComponent' }),
  targetRelationships: many(componentRelationshipsTable, { relationName: 'targetComponent' })
}));

export const componentRelationshipsRelations = relations(componentRelationshipsTable, ({ one }) => ({
  sourceComponent: one(componentsTable, {
    fields: [componentRelationshipsTable.source_component_id],
    references: [componentsTable.id],
    relationName: 'sourceComponent'
  }),
  targetComponent: one(componentsTable, {
    fields: [componentRelationshipsTable.target_component_id],
    references: [componentsTable.id],
    relationName: 'targetComponent'
  }),
  creator: one(usersTable, {
    fields: [componentRelationshipsTable.created_by],
    references: [usersTable.id],
    relationName: 'relationshipCreator'
  })
}));

export const artifactsRelations = relations(artifactsTable, ({ one }) => ({
  component: one(componentsTable, {
    fields: [artifactsTable.component_id],
    references: [componentsTable.id]
  }),
  project: one(projectsTable, {
    fields: [artifactsTable.project_id],
    references: [projectsTable.id]
  }),
  uploader: one(usersTable, {
    fields: [artifactsTable.uploaded_by],
    references: [usersTable.id],
    relationName: 'artifactUploader'
  })
}));

export const projectMembersRelations = relations(projectMembersTable, ({ one }) => ({
  project: one(projectsTable, {
    fields: [projectMembersTable.project_id],
    references: [projectsTable.id]
  }),
  user: one(usersTable, {
    fields: [projectMembersTable.user_id],
    references: [usersTable.id],
    relationName: 'userMemberships'
  }),
  addedBy: one(usersTable, {
    fields: [projectMembersTable.added_by],
    references: [usersTable.id],
    relationName: 'memberAdder'
  })
}));

// Export all tables for relation queries
export const tables = {
  organizations: organizationsTable,
  users: usersTable,
  projects: projectsTable,
  components: componentsTable,
  componentRelationships: componentRelationshipsTable,
  artifacts: artifactsTable,
  projectMembers: projectMembersTable
};

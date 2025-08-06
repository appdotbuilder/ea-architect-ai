
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { organizationsTable } from '../db/schema';
import { type UpdateOrganizationInput } from '../schema';
import { updateOrganization } from '../handlers/update_organization';
import { eq } from 'drizzle-orm';

describe('updateOrganization', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update organization name', async () => {
    // Create test organization
    const created = await db.insert(organizationsTable)
      .values({
        name: 'Original Name',
        description: 'Original description'
      })
      .returning()
      .execute();

    const testInput: UpdateOrganizationInput = {
      id: created[0].id,
      name: 'Updated Name'
    };

    const result = await updateOrganization(testInput);

    expect(result.name).toEqual('Updated Name');
    expect(result.description).toEqual('Original description'); // Should remain unchanged
    expect(result.id).toEqual(created[0].id);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > created[0].updated_at).toBe(true);
  });

  it('should update organization description', async () => {
    // Create test organization
    const created = await db.insert(organizationsTable)
      .values({
        name: 'Test Organization',
        description: 'Original description'
      })
      .returning()
      .execute();

    const testInput: UpdateOrganizationInput = {
      id: created[0].id,
      description: 'Updated description'
    };

    const result = await updateOrganization(testInput);

    expect(result.name).toEqual('Test Organization'); // Should remain unchanged
    expect(result.description).toEqual('Updated description');
    expect(result.id).toEqual(created[0].id);
  });

  it('should update multiple fields', async () => {
    // Create test organization
    const created = await db.insert(organizationsTable)
      .values({
        name: 'Original Name',
        description: 'Original description'
      })
      .returning()
      .execute();

    const testInput: UpdateOrganizationInput = {
      id: created[0].id,
      name: 'Updated Name',
      description: 'Updated description'
    };

    const result = await updateOrganization(testInput);

    expect(result.name).toEqual('Updated Name');
    expect(result.description).toEqual('Updated description');
    expect(result.id).toEqual(created[0].id);
  });

  it('should set description to null', async () => {
    // Create test organization
    const created = await db.insert(organizationsTable)
      .values({
        name: 'Test Organization',
        description: 'Original description'
      })
      .returning()
      .execute();

    const testInput: UpdateOrganizationInput = {
      id: created[0].id,
      description: null
    };

    const result = await updateOrganization(testInput);

    expect(result.description).toBeNull();
    expect(result.name).toEqual('Test Organization'); // Should remain unchanged
  });

  it('should save changes to database', async () => {
    // Create test organization
    const created = await db.insert(organizationsTable)
      .values({
        name: 'Original Name',
        description: 'Original description'
      })
      .returning()
      .execute();

    const testInput: UpdateOrganizationInput = {
      id: created[0].id,
      name: 'Updated Name'
    };

    await updateOrganization(testInput);

    // Verify changes persisted in database
    const organizations = await db.select()
      .from(organizationsTable)
      .where(eq(organizationsTable.id, created[0].id))
      .execute();

    expect(organizations).toHaveLength(1);
    expect(organizations[0].name).toEqual('Updated Name');
    expect(organizations[0].description).toEqual('Original description');
  });

  it('should throw error for non-existent organization', async () => {
    const testInput: UpdateOrganizationInput = {
      id: 99999,
      name: 'Updated Name'
    };

    expect(updateOrganization(testInput)).rejects.toThrow(/not found/i);
  });
});

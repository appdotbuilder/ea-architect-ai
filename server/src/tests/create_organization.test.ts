
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { organizationsTable } from '../db/schema';
import { type CreateOrganizationInput } from '../schema';
import { createOrganization } from '../handlers/create_organization';
import { eq } from 'drizzle-orm';

// Test inputs
const testInput: CreateOrganizationInput = {
  name: 'Test Organization',
  description: 'An organization for testing purposes'
};

const minimalInput: CreateOrganizationInput = {
  name: 'Minimal Org'
};

describe('createOrganization', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an organization with all fields', async () => {
    const result = await createOrganization(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Organization');
    expect(result.description).toEqual('An organization for testing purposes');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create an organization with minimal fields', async () => {
    const result = await createOrganization(minimalInput);

    expect(result.name).toEqual('Minimal Org');
    expect(result.description).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save organization to database', async () => {
    const result = await createOrganization(testInput);

    // Query using proper drizzle syntax
    const organizations = await db.select()
      .from(organizationsTable)
      .where(eq(organizationsTable.id, result.id))
      .execute();

    expect(organizations).toHaveLength(1);
    expect(organizations[0].name).toEqual('Test Organization');
    expect(organizations[0].description).toEqual('An organization for testing purposes');
    expect(organizations[0].created_at).toBeInstanceOf(Date);
    expect(organizations[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle null description correctly', async () => {
    const result = await createOrganization(minimalInput);

    // Verify in database
    const organizations = await db.select()
      .from(organizationsTable)
      .where(eq(organizationsTable.id, result.id))
      .execute();

    expect(organizations).toHaveLength(1);
    expect(organizations[0].name).toEqual('Minimal Org');
    expect(organizations[0].description).toBeNull();
  });
});

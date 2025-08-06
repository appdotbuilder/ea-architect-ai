
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, organizationsTable } from '../db/schema';
import { type UpdateUserInput, type CreateUserInput } from '../schema';
import { updateUser } from '../handlers/update_user';
import { eq } from 'drizzle-orm';

describe('updateUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update user with all fields', async () => {
    // Create organization first
    const orgResult = await db.insert(organizationsTable)
      .values({
        name: 'Test Org',
        description: 'Test organization'
      })
      .returning()
      .execute();

    const organization = orgResult[0];

    // Create initial user
    const createResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        role: 'member',
        organization_id: organization.id
      })
      .returning()
      .execute();

    const createdUser = createResult[0];

    // Create another organization for update
    const newOrgResult = await db.insert(organizationsTable)
      .values({
        name: 'New Org',
        description: 'New organization'
      })
      .returning()
      .execute();

    const newOrganization = newOrgResult[0];

    const updateInput: UpdateUserInput = {
      id: createdUser.id,
      email: 'updated@example.com',
      name: 'Updated User',
      role: 'admin',
      organization_id: newOrganization.id
    };

    const result = await updateUser(updateInput);

    expect(result.id).toEqual(createdUser.id);
    expect(result.email).toEqual('updated@example.com');
    expect(result.name).toEqual('Updated User');
    expect(result.role).toEqual('admin');
    expect(result.organization_id).toEqual(newOrganization.id);
    expect(result.created_at).toEqual(createdUser.created_at);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > createdUser.updated_at).toBe(true);
  });

  it('should update user with partial fields', async () => {
    // Create organization first
    const orgResult = await db.insert(organizationsTable)
      .values({
        name: 'Test Org',
        description: 'Test organization'
      })
      .returning()
      .execute();

    const organization = orgResult[0];

    // Create initial user
    const createResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        role: 'member',
        organization_id: organization.id
      })
      .returning()
      .execute();

    const createdUser = createResult[0];

    const updateInput: UpdateUserInput = {
      id: createdUser.id,
      name: 'Updated Name Only'
    };

    const result = await updateUser(updateInput);

    expect(result.id).toEqual(createdUser.id);
    expect(result.email).toEqual('test@example.com'); // Unchanged
    expect(result.name).toEqual('Updated Name Only');
    expect(result.role).toEqual('member'); // Unchanged
    expect(result.organization_id).toEqual(organization.id); // Unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > createdUser.updated_at).toBe(true);
  });

  it('should update user with null organization_id', async () => {
    // Create organization first
    const orgResult = await db.insert(organizationsTable)
      .values({
        name: 'Test Org',
        description: 'Test organization'
      })
      .returning()
      .execute();

    const organization = orgResult[0];

    // Create initial user
    const createResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        role: 'member',
        organization_id: organization.id
      })
      .returning()
      .execute();

    const createdUser = createResult[0];

    const updateInput: UpdateUserInput = {
      id: createdUser.id,
      organization_id: null
    };

    const result = await updateUser(updateInput);

    expect(result.id).toEqual(createdUser.id);
    expect(result.organization_id).toBeNull();
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > createdUser.updated_at).toBe(true);
  });

  it('should save updated user to database', async () => {
    // Create organization first
    const orgResult = await db.insert(organizationsTable)
      .values({
        name: 'Test Org',
        description: 'Test organization'
      })
      .returning()
      .execute();

    const organization = orgResult[0];

    // Create initial user
    const createResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        role: 'member',
        organization_id: organization.id
      })
      .returning()
      .execute();

    const createdUser = createResult[0];

    const updateInput: UpdateUserInput = {
      id: createdUser.id,
      email: 'verified@example.com',
      role: 'admin'
    };

    const result = await updateUser(updateInput);

    // Verify database was updated
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].email).toEqual('verified@example.com');
    expect(users[0].name).toEqual('Test User'); // Unchanged
    expect(users[0].role).toEqual('admin');
    expect(users[0].organization_id).toEqual(organization.id); // Unchanged
    expect(users[0].updated_at).toBeInstanceOf(Date);
    expect(users[0].updated_at > createdUser.updated_at).toBe(true);
  });

  it('should throw error for non-existent user', async () => {
    const updateInput: UpdateUserInput = {
      id: 99999,
      name: 'Updated Name'
    };

    expect(updateUser(updateInput)).rejects.toThrow(/User with id 99999 not found/);
  });
});


import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, organizationsTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';

// Test inputs
const testUserInput: CreateUserInput = {
  email: 'test@example.com',
  name: 'Test User',
  role: 'member'
};

const testAdminInput: CreateUserInput = {
  email: 'admin@example.com',
  name: 'Admin User',
  role: 'admin'
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a user', async () => {
    const result = await createUser(testUserInput);

    expect(result.email).toEqual('test@example.com');
    expect(result.name).toEqual('Test User');
    expect(result.role).toEqual('member');
    expect(result.organization_id).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save user to database', async () => {
    const result = await createUser(testUserInput);

    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].email).toEqual('test@example.com');
    expect(users[0].name).toEqual('Test User');
    expect(users[0].role).toEqual('member');
    expect(users[0].organization_id).toBeNull();
    expect(users[0].created_at).toBeInstanceOf(Date);
    expect(users[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create an admin user', async () => {
    const result = await createUser(testAdminInput);

    expect(result.role).toEqual('admin');
    expect(result.email).toEqual('admin@example.com');
  });

  it('should create user with organization', async () => {
    // Create organization first
    const orgResult = await db.insert(organizationsTable)
      .values({
        name: 'Test Organization',
        description: 'A test organization'
      })
      .returning()
      .execute();

    const userWithOrgInput: CreateUserInput = {
      email: 'org-user@example.com',
      name: 'Org User',
      role: 'member',
      organization_id: orgResult[0].id
    };

    const result = await createUser(userWithOrgInput);

    expect(result.organization_id).toEqual(orgResult[0].id);
    expect(result.email).toEqual('org-user@example.com');
  });

  it('should reject duplicate email addresses', async () => {
    await createUser(testUserInput);

    await expect(createUser(testUserInput)).rejects.toThrow(/already exists/i);
  });

  it('should reject invalid organization_id', async () => {
    const invalidOrgInput: CreateUserInput = {
      email: 'invalid-org@example.com',
      name: 'Invalid Org User',
      role: 'member',
      organization_id: 999
    };

    await expect(createUser(invalidOrgInput)).rejects.toThrow(/not found/i);
  });

  it('should handle different role types correctly', async () => {
    const memberResult = await createUser({
      email: 'member@example.com',
      name: 'Member User',
      role: 'member'
    });

    const adminResult = await createUser({
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'admin'
    });

    expect(memberResult.role).toEqual('member');
    expect(adminResult.role).toEqual('admin');

    // Verify in database
    const memberInDb = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, memberResult.id))
      .execute();

    const adminInDb = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, adminResult.id))
      .execute();

    expect(memberInDb[0].role).toEqual('member');
    expect(adminInDb[0].role).toEqual('admin');
  });
});

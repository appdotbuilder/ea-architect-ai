
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, organizationsTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { getUsers } from '../handlers/get_users';

describe('getUsers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no users exist', async () => {
    const result = await getUsers();
    
    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });

  it('should return all users', async () => {
    // Create test organization first
    const orgResult = await db.insert(organizationsTable)
      .values({
        name: 'Test Organization',
        description: 'A test organization'
      })
      .returning()
      .execute();

    const organizationId = orgResult[0].id;

    // Create test users
    const testUsers = [
      {
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'admin' as const,
        organization_id: organizationId
      },
      {
        email: 'member@example.com',
        name: 'Member User',
        role: 'member' as const,
        organization_id: organizationId
      },
      {
        email: 'solo@example.com',
        name: 'Solo User',
        role: 'member' as const,
        organization_id: null
      }
    ];

    await db.insert(usersTable)
      .values(testUsers)
      .execute();

    const result = await getUsers();

    expect(result).toHaveLength(3);
    
    // Verify user data
    const adminUser = result.find(u => u.email === 'admin@example.com');
    expect(adminUser).toBeDefined();
    expect(adminUser?.name).toEqual('Admin User');
    expect(adminUser?.role).toEqual('admin');
    expect(adminUser?.organization_id).toEqual(organizationId);
    expect(adminUser?.id).toBeDefined();
    expect(adminUser?.created_at).toBeInstanceOf(Date);
    expect(adminUser?.updated_at).toBeInstanceOf(Date);

    const memberUser = result.find(u => u.email === 'member@example.com');
    expect(memberUser).toBeDefined();
    expect(memberUser?.name).toEqual('Member User');
    expect(memberUser?.role).toEqual('member');
    expect(memberUser?.organization_id).toEqual(organizationId);

    const soloUser = result.find(u => u.email === 'solo@example.com');
    expect(soloUser).toBeDefined();
    expect(soloUser?.name).toEqual('Solo User');
    expect(soloUser?.role).toEqual('member');
    expect(soloUser?.organization_id).toBeNull();
  });

  it('should return users in insertion order', async () => {
    // Create users in specific order
    const usersToCreate = [
      {
        email: 'first@example.com',
        name: 'First User',
        role: 'admin' as const,
        organization_id: null
      },
      {
        email: 'second@example.com',
        name: 'Second User',
        role: 'member' as const,
        organization_id: null
      }
    ];

    for (const user of usersToCreate) {
      await db.insert(usersTable)
        .values(user)
        .execute();
    }

    const result = await getUsers();

    expect(result).toHaveLength(2);
    expect(result[0].email).toEqual('first@example.com');
    expect(result[1].email).toEqual('second@example.com');
  });
});

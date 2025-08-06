
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { organizationsTable } from '../db/schema';
import { getOrganizations } from '../handlers/get_organizations';

describe('getOrganizations', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no organizations exist', async () => {
    const result = await getOrganizations();

    expect(result).toEqual([]);
  });

  it('should return all organizations', async () => {
    // Create test organizations
    await db.insert(organizationsTable)
      .values([
        {
          name: 'Organization A',
          description: 'First organization'
        },
        {
          name: 'Organization B',
          description: null
        },
        {
          name: 'Organization C',
          description: 'Third organization'
        }
      ])
      .execute();

    const result = await getOrganizations();

    expect(result).toHaveLength(3);
    expect(result[0].name).toEqual('Organization A');
    expect(result[0].description).toEqual('First organization');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);

    expect(result[1].name).toEqual('Organization B');
    expect(result[1].description).toBeNull();

    expect(result[2].name).toEqual('Organization C');
    expect(result[2].description).toEqual('Third organization');
  });

  it('should return organizations with correct field types', async () => {
    await db.insert(organizationsTable)
      .values({
        name: 'Test Org',
        description: 'Test description'
      })
      .execute();

    const result = await getOrganizations();

    expect(result).toHaveLength(1);
    const org = result[0];
    expect(typeof org.id).toBe('number');
    expect(typeof org.name).toBe('string');
    expect(typeof org.description).toBe('string');
    expect(org.created_at).toBeInstanceOf(Date);
    expect(org.updated_at).toBeInstanceOf(Date);
  });
});

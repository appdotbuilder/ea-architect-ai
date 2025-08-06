
import { db } from '../db';
import { usersTable, organizationsTable } from '../db/schema';
import { type CreateUserInput, type User } from '../schema';
import { eq } from 'drizzle-orm';

export const createUser = async (input: CreateUserInput): Promise<User> => {
  try {
    // Check if email already exists
    const existingUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.email, input.email))
      .limit(1)
      .execute();

    if (existingUser.length > 0) {
      throw new Error(`User with email ${input.email} already exists`);
    }

    // Validate organization exists if provided
    if (input.organization_id) {
      const organization = await db.select()
        .from(organizationsTable)
        .where(eq(organizationsTable.id, input.organization_id))
        .limit(1)
        .execute();

      if (organization.length === 0) {
        throw new Error(`Organization with id ${input.organization_id} not found`);
      }
    }

    // Insert user record
    const result = await db.insert(usersTable)
      .values({
        email: input.email,
        name: input.name,
        role: input.role,
        organization_id: input.organization_id || null
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('User creation failed:', error);
    throw error;
  }
};

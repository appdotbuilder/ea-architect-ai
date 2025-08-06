
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type UpdateUserInput, type User } from '../schema';
import { eq } from 'drizzle-orm';

export const updateUser = async (input: UpdateUserInput): Promise<User> => {
  try {
    // Build update object with only provided fields
    const updateData: Partial<typeof usersTable.$inferInsert> = {};
    
    if (input.email !== undefined) {
      updateData.email = input.email;
    }
    
    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    
    if (input.role !== undefined) {
      updateData.role = input.role;
    }
    
    if (input.organization_id !== undefined) {
      updateData.organization_id = input.organization_id;
    }

    // Add updated_at timestamp
    updateData.updated_at = new Date();

    // Update user record
    const result = await db.update(usersTable)
      .set(updateData)
      .where(eq(usersTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`User with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('User update failed:', error);
    throw error;
  }
};

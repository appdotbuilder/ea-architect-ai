
import { db } from '../db';
import { organizationsTable } from '../db/schema';
import { type UpdateOrganizationInput, type Organization } from '../schema';
import { eq } from 'drizzle-orm';

export const updateOrganization = async (input: UpdateOrganizationInput): Promise<Organization> => {
  try {
    // Check if organization exists
    const existing = await db.select()
      .from(organizationsTable)
      .where(eq(organizationsTable.id, input.id))
      .execute();

    if (existing.length === 0) {
      throw new Error(`Organization with id ${input.id} not found`);
    }

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.name !== undefined) {
      updateData.name = input.name;
    }

    if (input.description !== undefined) {
      updateData.description = input.description;
    }

    // Update organization record
    const result = await db.update(organizationsTable)
      .set(updateData)
      .where(eq(organizationsTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Organization update failed:', error);
    throw error;
  }
};

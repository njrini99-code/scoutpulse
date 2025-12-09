/**
 * Coaching Staff Data Access Helpers
 *
 * Handles all staff-related queries for college coaches
 */

import { createClient } from '@/lib/supabase/client';

export interface StaffMember {
  id: string;
  coach_id: string;
  name: string;
  role: string;
  email: string | null;
  phone: string | null;
  bio: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Get all staff members for a coach
 */
export async function getCoachingStaff(coachId: string): Promise<StaffMember[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('coaching_staff')
    .select('*')
    .eq('coach_id', coachId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching coaching staff:', error);
    return [];
  }

  return data as StaffMember[];
}

/**
 * Add a staff member
 */
export async function addStaffMember(
  coachId: string,
  staff: Omit<StaffMember, 'id' | 'coach_id' | 'created_at' | 'updated_at'>
): Promise<string | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('coaching_staff')
    .insert({
      coach_id: coachId,
      name: staff.name,
      role: staff.role,
      email: staff.email,
      phone: staff.phone,
      bio: staff.bio,
      avatar_url: staff.avatar_url,
      is_active: staff.is_active ?? true,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error adding staff member:', error);
    return null;
  }

  return data.id;
}

/**
 * Update a staff member
 */
export async function updateStaffMember(
  staffId: string,
  updates: Partial<Omit<StaffMember, 'id' | 'coach_id' | 'created_at' | 'updated_at'>>
): Promise<boolean> {
  const supabase = createClient();

  const { error } = await supabase
    .from('coaching_staff')
    .update(updates)
    .eq('id', staffId);

  if (error) {
    console.error('Error updating staff member:', error);
    return false;
  }

  return true;
}

/**
 * Delete a staff member
 */
export async function deleteStaffMember(staffId: string): Promise<boolean> {
  const supabase = createClient();

  const { error } = await supabase
    .from('coaching_staff')
    .delete()
    .eq('id', staffId);

  if (error) {
    console.error('Error deleting staff member:', error);
    return false;
  }

  return true;
}

/**
 * Toggle staff member active status
 */
export async function toggleStaffActive(staffId: string, isActive: boolean): Promise<boolean> {
  return updateStaffMember(staffId, { is_active: isActive });
}

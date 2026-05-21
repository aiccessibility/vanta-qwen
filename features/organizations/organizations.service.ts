import { getServerClient } from '@/services/supabase/client';
import type { Organization, OrganizationMember } from '@/types/database';
import { CreateOrganizationSchema, UpdateOrganizationSchema } from '@/lib/validators/database';

/**
 * Organizations Service
 * Handles all organization-related database operations
 */

export class OrganizationsService {
  /**
   * Get all organizations for the current user
   */
  static async getUserOrganizations(userId: string) {
    const supabase = getServerClient();
    
    const { data, error } = await supabase
      .from('organization_members')
      .select(`
        id,
        role,
        created_at,
        organization:organizations (
          id,
          owner_id,
          name,
          country,
          tax_id,
          created_at,
          updated_at
        )
      `)
      .eq('user_id', userId);

    if (error) throw error;

    return data.map((member) => ({
      ...member.organization,
      member_role: member.role as OrganizationMember['role']
    })) as (Organization & { member_role: OrganizationMember['role'] })[];
  }

  /**
   * Get a specific organization by ID
   */
  static async getOrganizationById(organizationId: string, userId: string) {
    const supabase = getServerClient();
    
    const { data, error } = await supabase
      .from('organizations')
      .select(`
        *,
        members:organization_members (
          id,
          user_id,
          role,
          created_at,
          user:users (
            id,
            email
          )
        ),
        bank_accounts:bank_accounts (
          id,
          provider,
          iban,
          balance,
          currency,
          is_active
        )
      `)
      .eq('id', organizationId)
      .single();

    if (error) throw error;

    // Verify user has access to this organization
    const hasAccess = data.members.some(
      (member: OrganizationMember) => member.user_id === userId
    );

    if (!hasAccess) {
      throw new Error('Unauthorized access to organization');
    }

    return data;
  }

  /**
   * Create a new organization
   */
  static async createOrganization(
    ownerId: string,
    data: { name: string; country: string; tax_id?: string }
  ) {
    const validatedData = CreateOrganizationSchema.parse(data);
    const supabase = getServerClient();

    const { data: organization, error } = await supabase
      .from('organizations')
      .insert({
        owner_id: ownerId,
        name: validatedData.name,
        country: validatedData.country,
        tax_id: validatedData.tax_id || null
      })
      .select()
      .single();

    if (error) throw error;

    // The trigger will automatically create the organization_member record with 'owner' role
    return organization as Organization;
  }

  /**
   * Update an organization
   */
  static async updateOrganization(
    organizationId: string,
    userId: string,
    data: { name?: string; country?: string; tax_id?: string | null }
  ) {
    const validatedData = UpdateOrganizationSchema.parse(data);
    const supabase = getServerClient();

    // Verify user is owner
    const { data: member } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .single();

    if (!member || member.role !== 'owner') {
      throw new Error('Only owners can update organizations');
    }

    const { data: organization, error } = await supabase
      .from('organizations')
      .update({
        name: validatedData.name,
        country: validatedData.country,
        tax_id: validatedData.tax_id ?? undefined,
        updated_at: new Date().toISOString()
      })
      .eq('id', organizationId)
      .select()
      .single();

    if (error) throw error;

    return organization as Organization;
  }

  /**
   * Add a member to an organization
   */
  static async addMember(
    organizationId: string,
    userId: string,
    newMemberId: string,
    role: 'admin' | 'member',
    currentUserId: string
  ) {
    const supabase = getServerClient();

    // Verify current user is owner or admin
    const { data: currentMember } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', currentUserId)
      .single();

    if (!currentMember || !['owner', 'admin'].includes(currentMember.role)) {
      throw new Error('Only owners and admins can add members');
    }

    const { data, error } = await supabase
      .from('organization_members')
      .insert({
        organization_id: organizationId,
        user_id: newMemberId,
        role
      })
      .select()
      .single();

    if (error) throw error;

    return data as OrganizationMember;
  }

  /**
   * Remove a member from an organization
   */
  static async removeMember(
    organizationId: string,
    memberId: string,
    currentUserId: string
  ) {
    const supabase = getServerClient();

    // Verify current user is owner
    const { data: currentMember } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', currentUserId)
      .single();

    if (!currentMember || currentMember.role !== 'owner') {
      throw new Error('Only owners can remove members');
    }

    // Prevent owner from removing themselves
    if (memberId === currentUserId) {
      throw new Error('Owners cannot remove themselves');
    }

    const { error } = await supabase
      .from('organization_members')
      .delete()
      .eq('organization_id', organizationId)
      .eq('user_id', memberId);

    if (error) throw error;

    return true;
  }

  /**
   * Update member role
   */
  static async updateMemberRole(
    organizationId: string,
    memberId: string,
    newRole: 'admin' | 'member',
    currentUserId: string
  ) {
    const supabase = getServerClient();

    // Verify current user is owner
    const { data: currentMember } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', currentUserId)
      .single();

    if (!currentMember || currentMember.role !== 'owner') {
      throw new Error('Only owners can change member roles');
    }

    const { data, error } = await supabase
      .from('organization_members')
      .update({ role: newRole })
      .eq('organization_id', organizationId)
      .eq('user_id', memberId)
      .select()
      .single();

    if (error) throw error;

    return data as OrganizationMember;
  }

  /**
   * Get user's role in an organization
   */
  static async getUserRole(organizationId: string, userId: string) {
    const supabase = getServerClient();

    const { data, error } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .single();

    if (error) return null;

    return data?.role as OrganizationMember['role'] | null;
  }
}

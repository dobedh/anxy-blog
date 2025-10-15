import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * API to list and manage orphaned auth accounts
 * (accounts in auth.users but not in profiles table)
 *
 * GET /api/orphaned-accounts - List all orphaned accounts
 * DELETE /api/orphaned-accounts?userId=xxx - Delete specific orphaned account
 */

// Use service role key for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET() {
  try {
    if (!supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Service role key not configured. Add SUPABASE_SERVICE_ROLE_KEY to .env.local' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log('🔍 Fetching all auth users...');

    // Get all auth users
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json(
        { error: 'Failed to fetch auth users', details: usersError.message },
        { status: 500 }
      );
    }

    console.log(`Found ${users?.length || 0} auth users`);

    // Get all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username');

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return NextResponse.json(
        { error: 'Failed to fetch profiles', details: profilesError.message },
        { status: 500 }
      );
    }

    console.log(`Found ${profiles?.length || 0} profiles`);

    // Create a Set of profile IDs for fast lookup
    const profileIds = new Set(profiles?.map(p => p.id) || []);

    // Find orphaned accounts (in auth.users but not in profiles)
    const orphanedAccounts = (users || [])
      .filter(user => !profileIds.has(user.id))
      .map(user => ({
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
        metadata: {
          preferred_username: user.user_metadata?.preferred_username,
          user_name: user.user_metadata?.user_name,
          name: user.user_metadata?.name,
          avatar_url: user.user_metadata?.avatar_url
        }
      }));

    console.log(`Found ${orphanedAccounts.length} orphaned accounts`);

    return NextResponse.json({
      total_auth_users: users?.length || 0,
      total_profiles: profiles?.length || 0,
      orphaned_count: orphanedAccounts.length,
      orphaned_accounts: orphanedAccounts
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    if (!supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Service role key not configured. Add SUPABASE_SERVICE_ROLE_KEY to .env.local' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId query parameter is required' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log(`🗑️  Attempting to delete user: ${userId}`);

    // Verify user exists and has no profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (profile) {
      return NextResponse.json(
        { error: 'Cannot delete user with existing profile. Delete profile first.' },
        { status: 400 }
      );
    }

    // Delete user from auth.users
    console.log('Calling supabase.auth.admin.deleteUser with userId:', userId);
    console.log('Using service key:', supabaseServiceKey.substring(0, 20) + '...');

    const { data: deleteData, error: deleteError } = await supabase.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error('Error deleting user:', deleteError);
      console.error('Error details:', {
        message: deleteError.message,
        status: deleteError.status,
        code: (deleteError as any).code,
        name: deleteError.name,
        stack: deleteError.stack
      });
      return NextResponse.json(
        {
          error: 'Failed to delete user',
          details: deleteError.message,
          code: (deleteError as any).code,
          status: deleteError.status
        },
        { status: 500 }
      );
    }

    console.log('Delete result:', deleteData);

    console.log(`✅ Successfully deleted user: ${userId}`);

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
      userId
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

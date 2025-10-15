import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';

/**
 * API to create missing profile for currently authenticated user
 *
 * This endpoint checks if the current user has a profile in the profiles table.
 * If not, it creates one using information from auth.users metadata.
 *
 * Usage: GET /api/fix-profile
 */
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    console.log('🔍 Checking profile for user:', user.email);

    // Check if profile exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error('Error checking profile:', profileError);
      return NextResponse.json(
        { error: 'Database error', details: profileError.message },
        { status: 500 }
      );
    }

    if (profile) {
      console.log('✅ Profile already exists:', profile.username);
      return NextResponse.json({
        status: 'exists',
        message: 'Profile already exists',
        profile: {
          id: profile.id,
          username: profile.username,
          bio: profile.bio,
          avatar_url: profile.avatar_url
        }
      });
    }

    // Profile doesn't exist - create it
    console.log('⚠️  Profile not found, creating new profile...');

    const userMetadata = user.user_metadata || {};
    const email = user.email || '';

    // Extract username from metadata or email
    let username = userMetadata.preferred_username ||
                  userMetadata.user_name ||
                  userMetadata.name ||
                  email.split('@')[0] ||
                  `user_${Date.now()}`;

    // Clean username: remove special characters
    username = username.replace(/[^a-zA-Z0-9_가-힣]/g, '');

    // Ensure username meets length requirements (2-20 chars)
    if (username.length < 2) {
      username = `user_${Date.now()}`;
    } else if (username.length > 20) {
      username = username.substring(0, 20);
    }

    console.log('   Proposed username:', username);

    // Check if username is taken
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username)
      .maybeSingle();

    if (existingUser) {
      const timestamp = Date.now().toString().slice(-6); // Last 6 digits
      username = `${username}_${timestamp}`;
      console.log('   Username taken, using:', username);
    }

    // Create profile
    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        username: username,
        bio: '',
        avatar_url: userMetadata.avatar_url || userMetadata.picture || null,
        is_private: false,
        allow_follow: true
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Failed to create profile:', insertError);
      return NextResponse.json(
        {
          error: 'Failed to create profile',
          details: insertError.message,
          code: insertError.code,
          hint: insertError.hint
        },
        { status: 500 }
      );
    }

    console.log('✅ Profile created successfully:', newProfile.username);

    return NextResponse.json({
      status: 'created',
      message: 'Profile created successfully',
      profile: {
        id: newProfile.id,
        username: newProfile.username,
        bio: newProfile.bio,
        avatar_url: newProfile.avatar_url
      }
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

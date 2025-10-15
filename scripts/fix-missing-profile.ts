/**
 * Fix Missing Profile Script
 *
 * This script creates a missing profile for authenticated users who signed up
 * via OAuth but don't have a corresponding profile in the profiles table.
 *
 * Usage:
 * 1. Make sure you're logged in as the user who needs a profile
 * 2. Run: npx tsx scripts/fix-missing-profile.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function fixMissingProfile() {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  console.log('🔍 Checking for users with missing profiles...\n');

  // Get all auth users
  const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();

  if (usersError) {
    console.error('❌ Error fetching users:', usersError.message);
    return;
  }

  console.log(`Found ${users?.length || 0} users in auth.users table\n`);

  // Check each user for missing profile
  for (const user of users || []) {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error(`❌ Error checking profile for ${user.email}:`, profileError.message);
      continue;
    }

    if (!profile) {
      console.log(`⚠️  Missing profile for user: ${user.email}`);
      console.log(`   User ID: ${user.id}`);
      console.log(`   Metadata:`, user.user_metadata);

      // Extract username from metadata or email
      const userMetadata = user.user_metadata || {};
      const email = user.email || '';

      let username = userMetadata.preferred_username ||
                    userMetadata.user_name ||
                    userMetadata.name ||
                    email.split('@')[0] ||
                    `user_${Date.now()}`;

      // Remove spaces and special characters from username
      username = username.replace(/[^a-zA-Z0-9_가-힣]/g, '');

      // Check if username already exists
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .maybeSingle();

      if (existingUser) {
        username = `${username}_${Date.now()}`;
      }

      console.log(`   Creating profile with username: ${username}\n`);

      // Create profile
      const { error: insertError } = await supabase.from('profiles').insert({
        id: user.id,
        username: username,
        bio: '',
        avatar_url: userMetadata.avatar_url || userMetadata.picture || null,
        is_private: false,
        allow_follow: true
      });

      if (insertError) {
        console.error(`❌ Failed to create profile for ${user.email}:`, insertError.message);
        console.error(`   Error details:`, insertError);
      } else {
        console.log(`✅ Successfully created profile for ${user.email}\n`);
      }
    } else {
      console.log(`✅ Profile exists for ${user.email} (@${profile.username})\n`);
    }
  }

  console.log('🎉 Done!');
}

fixMissingProfile().catch(console.error);

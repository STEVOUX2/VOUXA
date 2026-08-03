const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const adminEmail = process.env.ADMIN_EMAIL || 'nazcomatrix@gmail.com';
const adminPassword = process.env.ADMIN_PASSWORD || 'NAZCO999';

async function seedAdmin() {
  console.log(`⏳ Seeding admin user: ${adminEmail}...`);

  // Create user via Admin API
  const { data: user, error } = await supabase.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true,
  });

  if (error) {
    if (error.message.includes('already registered')) {
      console.log('✅ Admin user already exists.');
    } else {
      console.error('❌ Error creating user:', error.message);
    }
  } else {
    console.log(`✅ Successfully created admin user: ${adminEmail}`);
    console.log(`🔐 Password: ${adminPassword}`);
  }

  // The database trigger `handle_new_user()` should automatically insert this user 
  // into the `profiles` table with `is_admin = true` based on the email.
  console.log('✅ Seeding complete.');
}

seedAdmin();

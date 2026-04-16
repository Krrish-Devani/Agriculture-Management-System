const { createClient } = require('@supabase/supabase-js');

// Admin client — bypasses RLS (use for backend operations)
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Create a user-scoped client using their JWT
function getUserClient(accessToken) {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    }
  );
}

module.exports = { supabaseAdmin, getUserClient };

// =========================================================
// MaintainIQ — Supabase client
// =========================================================
// Loaded via CDN in every HTML page BEFORE this file:
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>

const SUPABASE_URL = "https://osbmkupyrkdsobzokfca.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_LZ-FB3KG423yTxXTkuOfXw_Cua-jlPW";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Table names — adjust here in one place if your schema differs.
const TABLES = {
  assets: "assets",
  tickets: "tickets"
};

// Status / urgency vocab shared across pages
const TICKET_STATUS = ["reported", "assigned", "resolved"];
const URGENCY_LEVELS = ["low", "medium", "high"];
const ASSET_STATUS = ["active", "maintenance", "inactive"];

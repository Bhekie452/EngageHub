"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabase = void 0;
// src/api/lib/supabase.ts
const supabase_js_1 = require("@supabase/supabase-js");
exports.supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL ?? '', process.env.SUPABASE_SERVICE_ROLE_KEY ?? '', {
    // Server-side - we never want a persisted session or auth redirects
    auth: { persistSession: false },
});

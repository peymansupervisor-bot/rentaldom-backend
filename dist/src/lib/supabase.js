"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BUCKET = exports.supabase = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
}
// Service-role client — bypasses RLS, only used server-side
exports.supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });
exports.BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? 'emlakie-media';

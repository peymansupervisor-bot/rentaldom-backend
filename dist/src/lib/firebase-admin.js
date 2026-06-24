"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyFirebaseToken = verifyFirebaseToken;
const supabase_js_1 = require("@supabase/supabase-js");
const supabaseAdmin = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
// Kept as verifyFirebaseToken for minimal diff — now verifies Supabase JWTs
async function verifyFirebaseToken(accessToken) {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(accessToken);
    if (error || !user)
        throw new Error('Invalid or expired token');
    if (!user.email)
        throw new Error('Token does not contain an email address');
    return { email: user.email, uid: user.id };
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
exports.loadUser = loadUser;
const jwt_1 = require("../lib/jwt");
const supabase_1 = require("../lib/supabase");
async function requireAuth(req, res, next) {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Missing authorization header' });
        return;
    }
    try {
        const payload = (0, jwt_1.verifyToken)(header.slice(7));
        req.userId = payload.userId;
        req.userEmail = payload.email;
        next();
    }
    catch {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
}
// Verify user exists and return their row — call after requireAuth
async function loadUser(req, res, next) {
    const { data, error } = await supabase_1.supabase
        .from('users')
        .select('*')
        .eq('id', req.userId)
        .single();
    if (error || !data) {
        res.status(401).json({ error: 'User not found' });
        return;
    }
    req.user = data;
    next();
}

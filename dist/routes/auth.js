"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const firebase_admin_1 = require("../lib/firebase-admin");
const supabase_1 = require("../lib/supabase");
const jwt_1 = require("../lib/jwt");
const storage_1 = require("../lib/storage");
const auth_1 = require("../middleware/auth");
const upload_1 = require("../middleware/upload");
const router = (0, express_1.Router)();
const tokenLimit = (0, express_rate_limit_1.default)({
    windowMs: 10 * 60 * 1000,
    max: 20,
    message: { error: 'Too many login attempts. Please wait 10 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});
// ─── POST /auth/verify-firebase-token ────────────────────────────────────────
// Called by the app after Firebase Phone Auth confirms the OTP on-device.
// Receives the Firebase ID token, validates it, and returns an Emlakie JWT.
router.post('/verify-firebase-token', tokenLimit, async (req, res) => {
    const { idToken } = req.body;
    if (!idToken) {
        res.status(400).json({ error: 'idToken is required' });
        return;
    }
    let phone;
    try {
        ({ phone } = await (0, firebase_admin_1.verifyFirebaseToken)(idToken));
    }
    catch (err) {
        console.error('Firebase token verification error:', err);
        res.status(401).json({ error: 'Invalid or expired authentication token' });
        return;
    }
    const { data: existing } = await supabase_1.supabase
        .from('profiles')
        .select('*')
        .eq('phone', phone)
        .single();
    let user = existing;
    let isNewUser = false;
    if (!user) {
        isNewUser = true;
        const { data: created, error } = await supabase_1.supabase
            .from('profiles')
            .insert({ phone, email: `${phone.replace(/\D/g, '')}@emlakie.com` })
            .select()
            .single();
        if (error || !created) {
            res.status(500).json({ error: 'Could not create user account' });
            return;
        }
        user = created;
    }
    const token = (0, jwt_1.signToken)({ userId: user.id, phone: user.phone });
    res.json({ token, user: normalizeUser(user), isNewUser });
});
// ─── POST /auth/complete-profile ─────────────────────────────────────────────
router.post('/complete-profile', auth_1.requireAuth, async (req, res) => {
    const { name, role, avatar } = req.body;
    if (!name || !role || !['tenant', 'landlord'].includes(role)) {
        res.status(400).json({ error: 'Name and valid role are required' });
        return;
    }
    const { data: user, error } = await supabase_1.supabase
        .from('profiles')
        .update({
        display_name: name.trim(),
        role,
        avatar_url: avatar ?? null,
        updated_at: new Date().toISOString(),
    })
        .eq('id', req.userId)
        .select()
        .single();
    if (error || !user) {
        res.status(500).json({ error: 'Could not update profile' });
        return;
    }
    const token = (0, jwt_1.signToken)({ userId: user.id, phone: user.phone });
    res.json({ token, user: normalizeUser(user) });
});
// ─── POST /auth/upload-avatar ─────────────────────────────────────────────────
router.post('/upload-avatar', auth_1.requireAuth, upload_1.upload.single('avatar'), async (req, res) => {
    if (!req.file) {
        res.status(400).json({ error: 'No image uploaded' });
        return;
    }
    try {
        const url = await (0, storage_1.uploadImage)(req.file.buffer, 'avatars', { width: 400, height: 400, quality: 88 });
        res.json({ url });
    }
    catch (err) {
        console.error('avatar upload error:', err);
        res.status(500).json({ error: 'Image upload failed' });
    }
});
// ─── GET /auth/me ─────────────────────────────────────────────────────────────
router.get('/me', auth_1.requireAuth, async (req, res) => {
    const { data: user, error } = await supabase_1.supabase
        .from('profiles')
        .select('*')
        .eq('id', req.userId)
        .single();
    if (error || !user) {
        res.status(404).json({ error: 'User not found' });
        return;
    }
    res.json(normalizeUser(user));
});
// ─── POST /auth/logout ────────────────────────────────────────────────────────
router.post('/logout', auth_1.requireAuth, (_req, res) => {
    res.json({ ok: true });
});
// Map DB profile columns to the shape the mobile app expects
function normalizeUser(p) {
    return {
        id: p.id,
        phone: p.phone,
        name: p.display_name,
        role: p.role,
        avatar: p.avatar_url,
        email: p.email,
        createdAt: p.created_at,
    };
}
exports.default = router;

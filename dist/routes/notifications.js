"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supabase_1 = require("../lib/supabase");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// ─── POST /notifications/register ────────────────────────────────────────────
// Called by the app on login/foreground to save the device push token
router.post('/register', auth_1.requireAuth, async (req, res) => {
    const { token } = req.body;
    if (!token || !token.startsWith('ExponentPushToken[')) {
        res.status(400).json({ error: 'Valid Expo push token required' });
        return;
    }
    const { error } = await supabase_1.supabase
        .from('profiles')
        .update({ push_token: token })
        .eq('id', req.userId);
    if (error) {
        res.status(500).json({ error: error.message });
        return;
    }
    res.json({ ok: true });
});
// ─── DELETE /notifications/register ──────────────────────────────────────────
// Called on logout to unregister the device
router.delete('/register', auth_1.requireAuth, async (req, res) => {
    await supabase_1.supabase
        .from('profiles')
        .update({ push_token: null })
        .eq('id', req.userId);
    res.json({ ok: true });
});
exports.default = router;

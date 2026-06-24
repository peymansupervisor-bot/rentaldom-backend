"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supabase_1 = require("../lib/supabase");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// ─── GET /messages/conversations ─────────────────────────────────────────────
router.get('/conversations', auth_1.requireAuth, async (req, res) => {
    const { data, error } = await supabase_1.supabase
        .from('conversations')
        .select(`
      id,
      listing_id,
      tenant_id,
      landlord_id,
      last_message,
      last_message_at,
      listings (title, photos),
      tenant:profiles!conversations_tenant_id_fkey (id, display_name, avatar_url),
      landlord:profiles!conversations_landlord_id_fkey (id, display_name, avatar_url)
    `)
        .or(`tenant_id.eq.${req.userId},landlord_id.eq.${req.userId}`)
        .order('last_message_at', { ascending: false });
    if (error) {
        res.status(500).json({ error: error.message });
        return;
    }
    const conversations = await Promise.all((data ?? []).map(async (conv) => {
        const isTenant = conv.tenant_id === req.userId;
        const other = isTenant ? conv.landlord : conv.tenant;
        const listing = conv.listings;
        const { count } = await supabase_1.supabase
            .from('app_messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .neq('sender_id', req.userId)
            .is('read_at', null);
        return {
            id: conv.id,
            listingId: conv.listing_id,
            listingTitle: listing?.title ?? '',
            listingPhoto: listing?.photos?.[0] ?? '',
            otherUserId: other?.id ?? '',
            otherUserName: other?.display_name ?? 'User',
            otherUserAvatar: other?.avatar_url ?? null,
            lastMessage: conv.last_message ?? '',
            lastMessageAt: conv.last_message_at,
            unreadCount: count ?? 0,
        };
    }));
    res.json(conversations);
});
// ─── GET /messages/:conversationId ───────────────────────────────────────────
router.get('/:conversationId', auth_1.requireAuth, async (req, res) => {
    const { data: conv } = await supabase_1.supabase
        .from('conversations')
        .select('tenant_id, landlord_id')
        .eq('id', req.params.conversationId)
        .single();
    if (!conv || (conv.tenant_id !== req.userId && conv.landlord_id !== req.userId)) {
        res.status(403).json({ error: 'Not authorized' });
        return;
    }
    const { before, limit = '50' } = req.query;
    let query = supabase_1.supabase
        .from('app_messages')
        .select('*')
        .eq('conversation_id', req.params.conversationId)
        .order('created_at', { ascending: false })
        .limit(+limit);
    if (before)
        query = query.lt('created_at', before);
    const { data, error } = await query;
    if (error) {
        res.status(500).json({ error: error.message });
        return;
    }
    res.json((data ?? []).reverse());
});
// ─── POST /messages/start ─────────────────────────────────────────────────────
router.post('/start', auth_1.requireAuth, async (req, res) => {
    const { listingId, firstMessage } = req.body;
    if (!listingId || !firstMessage?.trim()) {
        res.status(400).json({ error: 'listingId and firstMessage are required' });
        return;
    }
    const { data: listing } = await supabase_1.supabase
        .from('listings')
        .select('landlord_id')
        .eq('id', listingId)
        .single();
    if (!listing) {
        res.status(404).json({ error: 'Listing not found' });
        return;
    }
    if (listing.landlord_id === req.userId) {
        res.status(400).json({ error: 'You cannot message your own listing' });
        return;
    }
    // Ensure landlord_id is set on listing (website listings may not have it)
    if (!listing.landlord_id) {
        res.status(400).json({ error: 'This listing does not have a linked landlord account' });
        return;
    }
    const { data: existing } = await supabase_1.supabase
        .from('conversations')
        .select('id')
        .eq('listing_id', listingId)
        .eq('tenant_id', req.userId)
        .single();
    let conversationId;
    if (existing) {
        conversationId = existing.id;
    }
    else {
        const { data: created, error } = await supabase_1.supabase
            .from('conversations')
            .insert({
            listing_id: listingId,
            tenant_id: req.userId,
            landlord_id: listing.landlord_id,
            last_message: firstMessage.trim(),
            last_message_at: new Date().toISOString(),
        })
            .select('id')
            .single();
        if (error || !created) {
            res.status(500).json({ error: 'Could not start conversation' });
            return;
        }
        conversationId = created.id;
    }
    const { data: message, error: msgError } = await supabase_1.supabase
        .from('app_messages')
        .insert({
        conversation_id: conversationId,
        sender_id: req.userId,
        body: firstMessage.trim(),
        delivered_at: new Date().toISOString(),
    })
        .select()
        .single();
    if (msgError || !message) {
        res.status(500).json({ error: 'Could not send message' });
        return;
    }
    res.status(201).json({ conversationId, message });
});
// ─── POST /messages/:conversationId/send ─────────────────────────────────────
router.post('/:conversationId/send', auth_1.requireAuth, async (req, res) => {
    const { text } = req.body;
    if (!text?.trim()) {
        res.status(400).json({ error: 'text is required' });
        return;
    }
    const { data: conv } = await supabase_1.supabase
        .from('conversations')
        .select('tenant_id, landlord_id')
        .eq('id', req.params.conversationId)
        .single();
    if (!conv || (conv.tenant_id !== req.userId && conv.landlord_id !== req.userId)) {
        res.status(403).json({ error: 'Not authorized' });
        return;
    }
    const now = new Date().toISOString();
    const { data: message, error } = await supabase_1.supabase
        .from('app_messages')
        .insert({ conversation_id: req.params.conversationId, sender_id: req.userId, body: text.trim(), delivered_at: now })
        .select()
        .single();
    if (error || !message) {
        res.status(500).json({ error: 'Failed to send message' });
        return;
    }
    await supabase_1.supabase
        .from('conversations')
        .update({ last_message: text.trim(), last_message_at: now })
        .eq('id', req.params.conversationId);
    const recipientId = conv.tenant_id === req.userId ? conv.landlord_id : conv.tenant_id;
    const { data: sender } = await supabase_1.supabase.from('profiles').select('display_name').eq('id', req.userId).single();
    const { notifyUser } = await Promise.resolve().then(() => __importStar(require('../lib/notifications')));
    notifyUser(supabase_1.supabase, recipientId, {
        title: sender?.display_name ?? 'New Message',
        body: text.trim().length > 80 ? text.trim().slice(0, 77) + '...' : text.trim(),
        data: { screen: 'messages', conversationId: req.params.conversationId },
    }).catch(() => { });
    res.status(201).json({
        id: message.id,
        conversationId: message.conversation_id,
        senderId: message.sender_id,
        text: message.body,
        createdAt: message.created_at,
        deliveredAt: message.delivered_at,
        readAt: message.read_at,
    });
});
// ─── POST /messages/:conversationId/read ─────────────────────────────────────
router.post('/:conversationId/read', auth_1.requireAuth, async (req, res) => {
    const now = new Date().toISOString();
    await supabase_1.supabase
        .from('app_messages')
        .update({ read_at: now })
        .eq('conversation_id', req.params.conversationId)
        .neq('sender_id', req.userId)
        .is('read_at', null);
    res.json({ ok: true, readAt: now });
});
exports.default = router;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initChatServer = initChatServer;
const socket_io_1 = require("socket.io");
const jwt_1 = require("../lib/jwt");
const supabase_1 = require("../lib/supabase");
const notifications_1 = require("../lib/notifications");
function initChatServer(httpServer, clientOrigin) {
    const io = new socket_io_1.Server(httpServer, {
        cors: { origin: clientOrigin, credentials: true },
        path: '/chat',
    });
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token ||
            socket.handshake.query?.token;
        if (!token)
            return next(new Error('Authentication required'));
        try {
            const payload = (0, jwt_1.verifyToken)(token);
            socket.userId = payload.userId;
            next();
        }
        catch {
            next(new Error('Invalid token'));
        }
    });
    io.on('connection', (socket) => {
        console.log(`[chat] connected: ${socket.userId}`);
        socket.on('join_conversation', async ({ conversationId }) => {
            const { data } = await supabase_1.supabase
                .from('conversations')
                .select('tenant_id, landlord_id')
                .eq('id', conversationId)
                .single();
            if (!data || (data.tenant_id !== socket.userId && data.landlord_id !== socket.userId)) {
                socket.emit('error', { message: 'Not authorized for this conversation' });
                return;
            }
            socket.join(`conv:${conversationId}`);
        });
        socket.on('send_message', async ({ conversationId, text }) => {
            if (!text?.trim())
                return;
            const { data: conv } = await supabase_1.supabase
                .from('conversations')
                .select('tenant_id, landlord_id')
                .eq('id', conversationId)
                .single();
            if (!conv || (conv.tenant_id !== socket.userId && conv.landlord_id !== socket.userId))
                return;
            const now = new Date().toISOString();
            const { data: message, error } = await supabase_1.supabase
                .from('app_messages')
                .insert({
                conversation_id: conversationId,
                sender_id: socket.userId,
                body: text.trim(),
                delivered_at: now,
            })
                .select()
                .single();
            if (error || !message) {
                socket.emit('error', { message: 'Failed to send message' });
                return;
            }
            await supabase_1.supabase
                .from('conversations')
                .update({ last_message: text.trim(), last_message_at: now })
                .eq('id', conversationId);
            // Push notification to recipient if they're not already in the room
            const recipientId = conv.tenant_id === socket.userId ? conv.landlord_id : conv.tenant_id;
            const room = io.sockets.adapter.rooms.get(`conv:${conversationId}`);
            const recipientOnline = room && room.size > 1;
            if (!recipientOnline) {
                const { data: sender } = await supabase_1.supabase
                    .from('profiles').select('display_name').eq('id', socket.userId).single();
                (0, notifications_1.notifyUser)(supabase_1.supabase, recipientId, {
                    title: sender?.display_name ?? 'New Message',
                    body: text.trim().length > 80 ? text.trim().slice(0, 77) + '...' : text.trim(),
                    data: { screen: 'messages', conversationId },
                }).catch(() => { });
            }
            io.to(`conv:${conversationId}`).emit('new_message', {
                id: message.id,
                conversationId,
                senderId: message.sender_id,
                text: message.body,
                createdAt: message.created_at,
                deliveredAt: message.delivered_at,
                readAt: message.read_at,
            });
        });
        socket.on('mark_read', async ({ conversationId }) => {
            const readAt = new Date().toISOString();
            await supabase_1.supabase
                .from('app_messages')
                .update({ read_at: readAt })
                .eq('conversation_id', conversationId)
                .neq('sender_id', socket.userId)
                .is('read_at', null);
            socket.to(`conv:${conversationId}`).emit('message_read', { conversationId, readAt });
        });
        socket.on('disconnect', () => {
            console.log(`[chat] disconnected: ${socket.userId}`);
        });
    });
    return io;
}

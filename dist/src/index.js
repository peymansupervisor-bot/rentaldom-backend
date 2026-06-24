"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const auth_1 = __importDefault(require("./routes/auth"));
const listings_1 = __importDefault(require("./routes/listings"));
const ai_1 = __importDefault(require("./routes/ai"));
const messages_1 = __importDefault(require("./routes/messages"));
const places_1 = __importDefault(require("./routes/places"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const applications_1 = __importDefault(require("./routes/applications"));
const chat_1 = require("./services/chat");
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
app.set('trust proxy', 1); // Render sits behind a proxy; needed for rate-limiter IP detection
const PORT = process.env.PORT ?? 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? '*';
// ── Security & parsing ────────────────────────────────────────────────────────
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(express_1.default.json({ limit: '2mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// ── Global rate limit ─────────────────────────────────────────────────────────
app.use((0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
}));
// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
    const checks = {
        resend_api_key: !!process.env.RESEND_API_KEY,
        anthropic_api_key: !!process.env.ANTHROPIC_API_KEY,
        supabase_url: !!process.env.SUPABASE_URL,
        supabase_service_key: !!process.env.SUPABASE_SERVICE_KEY,
    };
    const allOk = Object.values(checks).every(Boolean);
    res.status(allOk ? 200 : 500).json({ ok: allOk, ts: new Date().toISOString(), checks });
});
// ── API routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', auth_1.default);
app.use('/api/listings', listings_1.default);
app.use('/api/ai', ai_1.default);
app.use('/api/messages', messages_1.default);
app.use('/api/places', places_1.default);
app.use('/api/notifications', notifications_1.default);
app.use('/api/applications', applications_1.default);
// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(err.status ?? 500).json({ error: err.message ?? 'Internal server error' });
});
// ── WebSocket chat server ─────────────────────────────────────────────────────
(0, chat_1.initChatServer)(httpServer, CLIENT_ORIGIN);
// ── Start ─────────────────────────────────────────────────────────────────────
httpServer.listen(PORT, () => {
    console.log(`\n🏠 EMLAKIE API running on port ${PORT}`);
    console.log(`   REST:      http://localhost:${PORT}/api`);
    console.log(`   WebSocket: ws://localhost:${PORT}/chat`);
    console.log(`   Health:    http://localhost:${PORT}/health\n`);
});

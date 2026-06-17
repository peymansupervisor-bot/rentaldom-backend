"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const rateLimit_1 = require("../src/lib/rateLimit");
const auth_1 = __importDefault(require("../src/routes/auth"));
const listings_1 = __importDefault(require("../src/routes/listings"));
const ai_1 = __importDefault(require("../src/routes/ai"));
const messages_1 = __importDefault(require("../src/routes/messages"));
const places_1 = __importDefault(require("../src/routes/places"));
const notifications_1 = __importDefault(require("../src/routes/notifications"));
const applications_1 = __importDefault(require("../src/routes/applications"));
const app = (0, express_1.default)();
app.set('trust proxy', 1);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? '*';
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(express_1.default.json({ limit: '2mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, rateLimit_1.rateLimit)({
    windowMs: 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
}));
app.get('/health', (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));
app.use('/api/auth', auth_1.default);
app.use('/api/listings', listings_1.default);
app.use('/api/ai', ai_1.default);
app.use('/api/messages', messages_1.default);
app.use('/api/places', places_1.default);
app.use('/api/notifications', notifications_1.default);
app.use('/api/applications', applications_1.default);
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(err.status ?? 500).json({ error: err.message ?? 'Internal server error' });
});
exports.default = app;

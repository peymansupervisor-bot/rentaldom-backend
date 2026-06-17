"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimit = rateLimit;
function rateLimit({ windowMs, max }) {
    const hits = new Map();
    return (req, res, next) => {
        const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
            req.socket.remoteAddress ||
            'unknown';
        const now = Date.now();
        const entry = hits.get(ip);
        if (!entry || now > entry.resetAt) {
            hits.set(ip, { count: 1, resetAt: now + windowMs });
            next();
            return;
        }
        entry.count++;
        if (entry.count > max) {
            res.status(429).json({ error: 'Too many requests' });
            return;
        }
        next();
    };
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const claude_1 = require("../lib/claude");
const rateLimit_1 = require("../lib/rateLimit");
const router = (0, express_1.Router)();
const aiLimit = (0, rateLimit_1.rateLimit)({
    windowMs: 60 * 1000,
    max: 20,
    message: { error: 'Too many AI requests. Please slow down.' },
});
// ─── POST /ai/generate-description ───────────────────────────────────────────
router.post('/generate-description', auth_1.requireAuth, aiLimit, async (req, res) => {
    const { bedrooms, bathrooms, sqft, propertyType, amenities, address, city } = req.body;
    if (!propertyType || bedrooms === undefined) {
        res.status(400).json({ error: 'bedrooms and propertyType are required' });
        return;
    }
    try {
        const result = await (0, claude_1.generateListingContent)({
            bedrooms: +bedrooms,
            bathrooms: +(bathrooms ?? 1),
            sqft: +(sqft ?? 0),
            propertyType,
            amenities: Array.isArray(amenities) ? amenities : [],
            address: address ?? '',
            city: city ?? '',
        });
        res.json(result);
    }
    catch (err) {
        console.error('AI description error:', err);
        res.status(500).json({ error: 'AI service unavailable. Please try again.' });
    }
});
// ─── POST /ai/rent-suggestion ─────────────────────────────────────────────────
router.post('/rent-suggestion', auth_1.requireAuth, aiLimit, async (req, res) => {
    const { city, bedrooms, bathrooms, sqft, propertyType, amenities } = req.body;
    if (!city || bedrooms === undefined || !propertyType) {
        res.status(400).json({ error: 'city, bedrooms, and propertyType are required' });
        return;
    }
    try {
        const result = await (0, claude_1.generateRentSuggestion)({
            city,
            bedrooms: +bedrooms,
            bathrooms: +(bathrooms ?? 1),
            sqft: +(sqft ?? 0),
            propertyType,
            amenities: Array.isArray(amenities) ? amenities : [],
        });
        res.json(result);
    }
    catch (err) {
        console.error('AI rent suggestion error:', err);
        res.status(500).json({ error: 'AI service unavailable. Please try again.' });
    }
});
exports.default = router;

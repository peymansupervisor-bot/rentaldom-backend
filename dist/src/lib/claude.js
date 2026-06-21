"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateListingContent = generateListingContent;
exports.generateRentSuggestion = generateRentSuggestion;
exports.scoreApplication = scoreApplication;
exports.generateTenantAutoReply = generateTenantAutoReply;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const client = new sdk_1.default({ apiKey: process.env.ANTHROPIC_API_KEY });
async function generateListingContent(params) {
    const prompt = `You are a professional real estate copywriter. Write a compelling listing title and description for this rental property.

Property details:
- Type: ${params.propertyType}
- Bedrooms: ${params.bedrooms}
- Bathrooms: ${params.bathrooms}
- Size: ${params.sqft > 0 ? `${params.sqft} sq ft` : 'not specified'}
- Location: ${params.address}, ${params.city}
- Amenities: ${params.amenities.length > 0 ? params.amenities.join(', ') : 'none listed'}

Return ONLY valid JSON in this exact format, no markdown, no extra text:
{"title": "...", "description": "..."}

Rules:
- Title: max 70 characters, highlight the best features
- Description: 3-4 sentences, warm and inviting tone, highlight key selling points
- Do NOT mention the price
- Do NOT use the word "cozy" or "charming"`;
    const message = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        messages: [{ role: 'user', content: prompt }],
    });
    const raw = message.content[0].text.trim();
    return JSON.parse(raw);
}
async function generateRentSuggestion(params) {
    const prompt = `You are a real estate market analyst. Based on current US rental market conditions, suggest a monthly rent for this property.

Property:
- City: ${params.city}
- Type: ${params.propertyType}
- Bedrooms: ${params.bedrooms}
- Bathrooms: ${params.bathrooms}
- Size: ${params.sqft > 0 ? `${params.sqft} sq ft` : 'unknown'}
- Amenities: ${params.amenities.join(', ') || 'basic'}

Return ONLY valid JSON in this exact format, no markdown:
{"suggested": 2400, "range": [2100, 2800], "confidence": 0.78}

Where:
- suggested: the single best monthly rent estimate in USD (integer)
- range: [low, high] market range in USD
- confidence: 0.0-1.0 how confident you are based on available info`;
    const message = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 128,
        messages: [{ role: 'user', content: prompt }],
    });
    const raw = message.content[0].text.trim();
    return JSON.parse(raw);
}
async function scoreApplication(params) {
    const incomeRatio = params.application.income / params.listing.price;
    const prompt = `You are a tenant screening AI. Score this rental application from 0-100.

Listing: ${params.listing.bedrooms}BR ${params.listing.propertyType} at $${params.listing.price}/mo
Applicant income: $${params.application.income}/mo (${incomeRatio.toFixed(1)}x rent)
Message: "${params.application.message}"

Standard: income should be 2.5-3x monthly rent.

Return ONLY valid JSON:
{"score": 82, "summary": "One sentence summary for the landlord"}`;
    const message = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 128,
        messages: [{ role: 'user', content: prompt }],
    });
    const raw = message.content[0].text.trim();
    return JSON.parse(raw);
}
async function generateTenantAutoReply(params) {
    const prompt = `You are a helpful property manager's assistant. Write a short, warm auto-reply email body (2–3 sentences) to a prospective tenant who just sent a rental inquiry.

Listing: "${params.listingTitle}" in ${params.listingCity} at $${params.listingPrice}/mo
Tenant name: ${params.tenantName}
Landlord/property name: ${params.landlordName}
Tenant message: "${params.tenantMessage}"

Write only the body text (no subject, no greeting like "Hi X", no sign-off). Be warm, confirm receipt, mention the landlord will follow up soon. Do not make up any facts or commitments. Keep it under 60 words.`;
    try {
        const message = await client.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 120,
            messages: [{ role: 'user', content: prompt }],
        });
        return message.content[0].text.trim();
    }
    catch {
        return `Thank you for your inquiry about this property! Your message has been received and ${params.landlordName} will be in touch with you shortly.`;
    }
}

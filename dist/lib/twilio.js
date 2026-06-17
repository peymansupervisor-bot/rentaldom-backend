"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VERIFY_SID = exports.twilioClient = void 0;
exports.sendOtp = sendOtp;
exports.verifyOtp = verifyOtp;
const twilio_1 = __importDefault(require("twilio"));
if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_VERIFY_SID) {
    throw new Error('Missing Twilio environment variables');
}
exports.twilioClient = (0, twilio_1.default)(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
exports.VERIFY_SID = process.env.TWILIO_VERIFY_SID;
// Send OTP — throws if number is VOIP/landline
async function sendOtp(phone) {
    // 1. Check line type — block VOIP and landlines
    const lookup = await exports.twilioClient.lookups.v2
        .phoneNumbers(phone)
        .fetch({ fields: 'line_type_intelligence' });
    const lineType = lookup.lineTypeIntelligence?.type;
    if (lineType && lineType !== 'mobile' && lineType !== 'nonFixedVoip') {
        // nonFixedVoip = Google Voice, Skype, etc. — block those too
        // Only allow 'mobile' line type
        const isVoip = lineType === 'nonFixedVoip' || lineType === 'voip';
        throw Object.assign(new Error(isVoip
            ? 'VOIP and internet numbers are not accepted. Please use a real mobile number.'
            : 'Only mobile phone numbers are accepted.'), { code: 'INVALID_LINE_TYPE', lineType });
    }
    // 2. Send OTP via Twilio Verify
    await exports.twilioClient.verify.v2
        .services(exports.VERIFY_SID)
        .verifications.create({ to: phone, channel: 'sms' });
}
// Verify OTP — returns true if approved
async function verifyOtp(phone, code) {
    const check = await exports.twilioClient.verify.v2
        .services(exports.VERIFY_SID)
        .verificationChecks.create({ to: phone, code });
    return check.status === 'approved';
}

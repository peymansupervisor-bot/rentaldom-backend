"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyFirebaseToken = verifyFirebaseToken;
const app_1 = require("firebase-admin/app");
const auth_1 = require("firebase-admin/auth");
function getAdminApp() {
    if ((0, app_1.getApps)().length > 0)
        return (0, app_1.getApps)()[0];
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!serviceAccount)
        throw new Error('FIREBASE_SERVICE_ACCOUNT env var is missing');
    return (0, app_1.initializeApp)({ credential: (0, app_1.cert)(JSON.parse(serviceAccount)) });
}
async function verifyFirebaseToken(idToken) {
    const decoded = await (0, auth_1.getAuth)(getAdminApp()).verifyIdToken(idToken);
    if (!decoded.phone_number)
        throw new Error('Token does not contain a phone number');
    return { phone: decoded.phone_number, uid: decoded.uid };
}

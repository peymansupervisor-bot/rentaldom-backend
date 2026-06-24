import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

function getAdminApp(): App {
  if (getApps().length > 0) return getApps()[0];
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccount) throw new Error('FIREBASE_SERVICE_ACCOUNT env var is missing');
  return initializeApp({ credential: cert(JSON.parse(serviceAccount)) });
}

export async function verifyFirebaseToken(idToken: string): Promise<{ email: string; uid: string }> {
  const decoded = await getAuth(getAdminApp()).verifyIdToken(idToken);
  if (!decoded.email) throw new Error('Token does not contain an email address');
  return { email: decoded.email, uid: decoded.uid };
}

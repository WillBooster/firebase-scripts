import admin from 'firebase-admin';
import { PromisePool } from 'minimal-promise-pool';

export function initializeAdmin(): admin.app.App {
  if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_PRIVATE_KEY || !process.env.FIREBASE_CLIENT_EMAIL) {
    console.error(
      'Please define the environment variables: FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY and FIREBASE_CLIENT_EMAIL'
    );
    process.exit(1);
  }

  return admin.initializeApp({
    credential: admin.credential.cert({
      type: 'service_account',
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY,
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
    } as any),
  });
}

export const promisePool = new PromisePool();

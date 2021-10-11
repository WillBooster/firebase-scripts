import path from 'path';

import { PromisePool } from 'minimal-promise-pool';
import dotenv from 'dotenv';
import admin from 'firebase-admin';

export function initializeAdmin(): admin.app.App {
  return admin.initializeApp({
    credential: admin.credential.cert({
      type: 'service_account',
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY,
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
    } as any),
    storageBucket: `${process.env.FIREBASE_PROJECT_ID}.appspot.com`,
  });
}

export const promisePool = new PromisePool();

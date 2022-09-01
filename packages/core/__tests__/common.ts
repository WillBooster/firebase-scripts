import fs from 'fs';
import path from 'path';

import { initializeTestEnvironment } from '@firebase/rules-unit-testing';

export function configureJest(): void {
  jest.setTimeout(180 * 1000);
}

export function configureFirebase(): void {
  beforeEach(async () => {
    const testEnv = await initializeTestEnvironment({
      projectId: process.env.FIREBASE_PROJECT_ID,
      firestore: {
        rules: fs.readFileSync(path.resolve('firebase', 'firestore.rules'), 'utf8'),
      },
    });
    await testEnv.clearFirestore();
  });
}

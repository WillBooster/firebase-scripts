import fs from 'node:fs';
import path from 'node:path';

import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { beforeEach } from 'vitest';

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

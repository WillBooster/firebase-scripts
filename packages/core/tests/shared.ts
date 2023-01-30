import { initializeAdmin } from '@firebase-scripts/shared/src/firebaseAdmin';
import type { App } from 'firebase-admin/app';
import type { CollectionReference, Firestore } from 'firebase-admin/firestore';

export function configureFirebase(): App {
  process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
  return initializeAdmin();
}

export async function getEmptyCollection(firestore: Firestore, collectionPath: string): Promise<CollectionReference> {
  const collection = firestore.collection(collectionPath);
  const docs = await collection.listDocuments();
  await Promise.all(docs.map((doc) => doc.delete()));
  return collection;
}

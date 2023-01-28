import { initializeAdmin } from '@firebase-scripts/shared/src/firebaseAdmin';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

import { copyDocument } from '../../src/copy';
import { configureFirebase, configureJest } from '../common';

configureJest();
configureFirebase();

const adminApp = initializeAdmin();

test.each([
  { id: 1, v: 1 },
  { id: 'a', date: Timestamp.fromDate(new Date(0)) },
  { id: 'a', dates: { d1: Timestamp.now(), d2: Timestamp.now() } },
] as Record<string, unknown>[])('copy (%p)', async (record) => {
  const srcCollectionPath = 'src';
  const destCollectionPath = 'dest';

  const srcCollection = getFirestore(adminApp).collection(srcCollectionPath);
  await srcCollection.doc().set(record);
  const srcDocsSnapshot = await srcCollection.get();
  const srcDoc = srcDocsSnapshot.docs[0];
  const srcId = srcDoc.id;
  await copyDocument(adminApp, `${srcCollectionPath}/${srcId}`, adminApp, `${destCollectionPath}/${srcId}`);

  const destCollection = getFirestore(adminApp).collection(destCollectionPath);
  const destDocsSnapshot = await destCollection.get();
  const destDocs = destDocsSnapshot.docs;

  expect(destDocs.length).toBe(1);
  expect(destDocs[0].id).toEqual(srcId);
  expect(destDocs[0].data()).toEqual(srcDoc.data());
});

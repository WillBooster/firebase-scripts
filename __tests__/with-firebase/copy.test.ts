import { firestore } from 'firebase-admin';

import { copyDocument } from '../../src/copyCommand';
import { initializeAdmin } from '../../src/firebaseAdmin';
import { configureFirebase, configureJest } from '../common';

configureJest();
configureFirebase();

const adminApp = initializeAdmin();

test.each([
  { id: 1, v: 1 },
  { id: 'a', date: firestore.Timestamp.fromDate(new Date(0)) },
  { id: 'a', dates: { d1: firestore.Timestamp.now(), d2: firestore.Timestamp.now() } },
] as Record<string, unknown>[])('copy (%p)', async (record) => {
  const srcCollectionPath = 'src';
  const destCollectionPath = 'dest';

  const srcCollection = adminApp.firestore().collection(srcCollectionPath);
  await srcCollection.doc().set(record);
  const srcDoc = (await srcCollection.get()).docs[0];
  const srcId = srcDoc.id;
  await copyDocument(adminApp, `${srcCollectionPath}/${srcId}`, adminApp, `${destCollectionPath}/${srcId}`);

  const destCollection = adminApp.firestore().collection(destCollectionPath);
  const destDocs = (await destCollection.get()).docs;

  expect(destDocs.length).toBe(1);
  expect(destDocs[0].id).toEqual(srcId);
  expect(destDocs[0].data()).toEqual(srcDoc.data());
});

import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { expect, test } from 'vitest';

import { copyDocument } from '../../src/copy';
import { configureFirebase, getEmptyCollection } from '../shared';

const adminApp = configureFirebase();
const firestore = getFirestore(adminApp);

test.each([
  { id: 1, v: 1 },
  { id: 'a', date: Timestamp.fromDate(new Date(0)) },
  { id: 'a', dates: { d1: Timestamp.now(), d2: Timestamp.now() } },
] as Record<string, unknown>[])(
  'copy (%p)',
  async (record) => {
    const srcCollectionPath = 'copy-src';
    const destCollectionPath = 'copy-dest';

    const srcCollection = await getEmptyCollection(firestore, srcCollectionPath);
    const destCollection = await getEmptyCollection(firestore, destCollectionPath);

    await srcCollection.doc().set(record);
    const srcDocsSnapshot = await srcCollection.get();
    const srcDoc = srcDocsSnapshot.docs[0];
    const srcId = srcDoc.id;
    await copyDocument(adminApp, `${srcCollectionPath}/${srcId}`, adminApp, `${destCollectionPath}/${srcId}`);

    const destDocsSnapshot = await destCollection.get();
    const destDocs = destDocsSnapshot.docs;

    expect(destDocs.length).toBe(1);
    expect(destDocs[0].id).toEqual(srcId);
    expect(destDocs[0].data()).toEqual(srcDoc.data());
  },
  180 * 1000
);

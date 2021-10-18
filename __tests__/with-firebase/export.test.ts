import path from 'path';

import { firestore } from 'firebase-admin';

import { exportCollections } from '../../src/exportCommand';
import { initializeAdmin } from '../../src/firebaseAdmin';
import { importCollection } from '../../src/importCommand';
import { configureFirebase, configureJest } from '../common';

configureJest();
configureFirebase();

const adminApp = initializeAdmin();

test.each([
  [
    { id: 1, v: 1 },
    { id: 2, v: 2 },
  ],
  [
    { id: 'a', date: firestore.Timestamp.fromDate(new Date(0)) },
    { id: 'b', date: firestore.Timestamp.fromDate(new Date(1)) },
    { id: 'c', date: firestore.Timestamp.fromDate(new Date()) },
  ],
  [
    { id: 'a', dates: { d1: firestore.Timestamp.now(), d2: firestore.Timestamp.now() } },
    { id: 'b', d1: firestore.Timestamp.now(), d2: { date: firestore.Timestamp.now() } },
    { id: 'c', d1: firestore.Timestamp.now(), d2: { d3: { d4: firestore.Timestamp.now() } } },
  ],
])('export/import(%p)', async (...records: Record<string, unknown>[]) => {
  const testCollection = adminApp.firestore().collection('test');
  const test2Collection = adminApp.firestore().collection('test2');
  for (const record of records) {
    await testCollection.doc().set(record);
  }

  const dirPath = path.resolve('test-fixtures', 'temp');
  await exportCollections(adminApp, ['test'], dirPath);
  await importCollection(adminApp, path.join(dirPath, 'test.json'), 'test2');

  const testDocs = await testCollection.listDocuments();
  const test2Docs = await test2Collection.listDocuments();
  expect(testDocs.length).toBe(records.length);
  expect(test2Docs.length).toBe(records.length);
  const testDataList = (await Promise.all(testDocs.map(async (d) => (await d.get()).data()))).sort((a: any, b: any) =>
    a.id.toString().localeCompare(b.id.toString())
  );
  const test2DataList = (await Promise.all(test2Docs.map(async (d) => (await d.get()).data()))).sort((a: any, b: any) =>
    a.id.toString().localeCompare(b.id.toString())
  );
  expect(testDataList).toEqual(records);
  expect(test2DataList).toEqual(records);
  expect(testDocs.map((d) => d.id)).toEqual(test2Docs.map((d) => d.id));
});

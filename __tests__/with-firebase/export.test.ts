import path from 'path';

import { exportCollections } from '../../src/exportCommand';
import { adminApp } from '../../src/firebaseAdmin';
import { importCollection } from '../../src/importCommand';
import { configureFirebase, configureJest } from '../common';

configureJest();
configureFirebase();

test.each([
  [{ v: 1 }, { v: 2 }],
  [
    { id: 'a', date: new Date(0) },
    { id: 'b', date: new Date(1) },
    { id: 'c', date: new Date() },
  ],
])('export/import(%p)', async (...records: Record<string, unknown>[]) => {
  const testCollection = adminApp.firestore().collection('test');
  const test2Collection = adminApp.firestore().collection('test2');
  for (const record of records) {
    await testCollection.doc().set(record);
  }

  const dirPath = path.resolve('test-fixtures', 'temp');
  await exportCollections(['test'], dirPath);
  await importCollection(path.join(dirPath, 'test.json'), 'test2');

  const testDocs = await testCollection.listDocuments();
  const test2Docs = await test2Collection.listDocuments();
  expect(testDocs.length).toBe(records.length);
  expect(test2Docs.length).toBe(records.length);
  expect(testDocs.map((d) => d.id)).toEqual(test2Docs.map((d) => d.id));
  expect(await Promise.all(testDocs.map(async (d) => (await d.get()).data()))).toEqual(
    await Promise.all(test2Docs.map(async (d) => (await d.get()).data()))
  );
});

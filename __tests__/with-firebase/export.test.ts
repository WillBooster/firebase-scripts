import path from 'path';

import { firestore } from 'firebase-admin';

import { exportCollections, OptionalParamsToExport } from '../../src/exportCommand';
import { initializeAdmin } from '../../src/firebaseAdmin';
import { importCollection } from '../../src/importCommand';
import { configureFirebase, configureJest } from '../common';

configureJest();
configureFirebase();

const adminApp = initializeAdmin();

function exportTest(params?: OptionalParamsToExport): void {
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
    [{ id: 1, b1: Buffer.from([0x61]), b2: Buffer.from([0x00, 0x62, 0xff]) }],
    ...[9, 10, 11, 100].map((arraySize) => [...Array(arraySize)].map((_, idx) => ({ id: idx, v: idx }))),
  ])('export/import(%p)', async (...records: Record<string, unknown>[]) => {
    const testCollection = adminApp.firestore().collection('test/test/test');
    const test2Collection = adminApp.firestore().collection('test/test/test2');
    for (const record of records) {
      await testCollection.doc().set(record);
    }

    const dirPath = path.resolve('test-fixtures', 'temp');
    await exportCollections(adminApp, ['test/test/test'], dirPath, params);
    await importCollection(adminApp, path.join(dirPath, 'test-test-test.json'), 'test/test/test2');

    const testDocs = await testCollection.listDocuments();
    const test2Docs = await test2Collection.listDocuments();
    expect(testDocs.length).toBe(records.length);
    expect(test2Docs.length).toBe(records.length);

    const recordDataList = [...records].sort((a: any, b: any) => a.id.toString().localeCompare(b.id.toString()));
    const testDataList = (await Promise.all(testDocs.map(async (d) => (await d.get()).data()))).sort((a: any, b: any) =>
      a.id.toString().localeCompare(b.id.toString())
    );
    const test2DataList = (await Promise.all(test2Docs.map(async (d) => (await d.get()).data()))).sort(
      (a: any, b: any) => a.id.toString().localeCompare(b.id.toString())
    );
    expect(testDataList).toEqual(recordDataList);
    expect(test2DataList).toEqual(recordDataList);
    expect(testDocs.map((d) => d.id)).toEqual(test2Docs.map((d) => d.id));
  });
}

describe('export without hyper parameter', () => exportTest());
describe('export with hyper parameter', () => exportTest({ batchSize: 10 }));

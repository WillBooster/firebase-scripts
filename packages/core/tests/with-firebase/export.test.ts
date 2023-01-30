import path from 'node:path';

import { initializeAdmin } from '@firebase-scripts/shared/src/firebaseAdmin';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { expect, test } from 'vitest';

import { exportCollections, ExportOptions } from '../../src/export';
import { importCollection } from '../../src/import';
import { configureFirebase } from '../shared';

configureFirebase();

const adminApp = initializeAdmin();

function testExportAndImport(params?: ExportOptions): void {
  test.each([
    [
      { id: 1, v: 1 },
      { id: 2, v: 2 },
    ],
    [
      { id: 'a', date: Timestamp.fromDate(new Date(0)) },
      { id: 'b', date: Timestamp.fromDate(new Date(1)) },
      { id: 'c', date: Timestamp.fromDate(new Date()) },
    ],
    [
      { id: 'a', dates: { d1: Timestamp.now(), d2: Timestamp.now() } },
      { id: 'b', d1: Timestamp.now(), d2: { date: Timestamp.now() } },
      { id: 'c', d1: Timestamp.now(), d2: { d3: { d4: Timestamp.now() } } },
    ],
    [{ id: 1, b1: Buffer.from([0x61]), b2: Buffer.from([0x00, 0x62, 0xff]) }],
    ...[9, 10, 11, 100].map((arraySize) => Array.from({ length: arraySize }).map((_, idx) => ({ id: idx, v: idx }))),
  ])('[%p, ... ]', async (...records: Record<string, unknown>[]) => {
    const testCollection = getFirestore(adminApp).collection('test/test/test');
    const test2Collection = getFirestore(adminApp).collection('test/test/test2');
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
    const testDocSnapshots = await Promise.all(testDocs.map((d) => d.get()));
    const testDataList = testDocSnapshots
      .map((s) => s.data())
      .sort((a: any, b: any) => a.id.toString().localeCompare(b.id.toString()));
    const test2DocSnapshots = await Promise.all(test2Docs.map((d) => d.get()));
    const test2DataList = test2DocSnapshots
      .map((s) => s.data())
      .sort((a: any, b: any) => a.id.toString().localeCompare(b.id.toString()));
    expect(testDataList).toEqual(recordDataList);
    expect(test2DataList).toEqual(recordDataList);
    expect(testDocs.map((d) => d.id)).toEqual(test2Docs.map((d) => d.id));
  });
}

test('export and import a collection without options', () => testExportAndImport(), 180 * 1000);
test('export and import a collection with options', () => testExportAndImport({ batchSize: 10 }), 180 * 1000);

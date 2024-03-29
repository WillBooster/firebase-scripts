import fsp from 'node:fs/promises';
import path from 'node:path';

import { getFirestore } from 'firebase-admin/firestore';
import { describe, expect, test } from 'vitest';

import { downloadBlobToFile } from '../../src/blob';
import { configureFirebase } from '../shared';

const adminApp = configureFirebase();
const firestore = getFirestore(adminApp);

describe(
  'get-blob',
  () => {
    test.each<[string, string, string, FirebaseFirestore.DocumentData, Buffer]>([
      [
        'collection/document',
        'field',
        path.resolve('test-fixtures', 'temp', 'output.bin'),
        { field: Buffer.from([0x61]) },
        Buffer.from([0x61]),
      ],
      [
        'collection1/document1/collection2/document2',
        'field1.field2.field3.field4',
        path.resolve('test-fixtures', 'temp', 'output.bin'),
        { field1: { field2: { field3: { field4: Buffer.from([0x62, 0x75, 0x66, 0x66, 0x65, 0x72]) } } } },
        Buffer.from([0x62, 0x75, 0x66, 0x66, 0x65, 0x72]),
      ],
    ])(
      '%s %s -o "%s" (when the document is \'%j\')',
      async (documentPath, fieldPath, outputFilePath, document, expectedBuffer) => {
        // Prepare a document for testing.
        await firestore.doc(documentPath).set(document);

        // Test.
        await downloadBlobToFile(adminApp, documentPath, fieldPath, outputFilePath);

        const buffer = await fsp.readFile(outputFilePath);
        expect(buffer).toEqual(expectedBuffer);
      }
    );

    test('when a document path was not provided', async () => {
      await expect(() =>
        downloadBlobToFile(adminApp, undefined, undefined, path.resolve('test-fixtures', 'temp', 'output.bin'))
      ).rejects.toThrow('Provide a slash-separated document path to download.');
    });

    test('when a field path was not provided', async () => {
      await expect(() =>
        downloadBlobToFile(
          adminApp,
          'collection/document',
          undefined,
          path.resolve('test-fixtures', 'temp', 'output.bin')
        )
      ).rejects.toThrow('Provide a dot-separated field path to download.');
    });

    test('when the collection does not exist', async () => {
      await firestore.doc('collection/document').set({ field: 'value' });

      await expect(() =>
        downloadBlobToFile(
          adminApp,
          'nonExistentCollection/document',
          'field',
          path.resolve('test-fixtures', 'temp', 'output.bin')
        )
      ).rejects.toThrow('The document "nonExistentCollection/document" does not exist.');
    });

    test('when the document does not exist', async () => {
      await firestore.doc('collection/document').set({ field: 'value' });

      await expect(() =>
        downloadBlobToFile(
          adminApp,
          'collection/nonExistentDocument',
          'field',
          path.resolve('test-fixtures', 'temp', 'output.bin')
        )
      ).rejects.toThrow('The document "collection/nonExistentDocument" does not exist.');
    });

    test('when the field does not exist', async () => {
      await firestore.doc('collection/document').set({ field: 'value' });

      await expect(() =>
        downloadBlobToFile(
          adminApp,
          'collection/document',
          'nonExistentField',
          path.resolve('test-fixtures', 'temp', 'output.bin')
        )
      ).rejects.toThrow('The field "nonExistentField" does not exist in the document "collection/document".');
    });
  },
  180 * 1000
);

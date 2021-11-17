import fsp from 'fs/promises';

import { initializeAdmin } from '../../src/firebaseAdmin';
import { getBlobCommandHandler } from '../../src/getBlobCommand';
import { configureFirebase, configureJest } from '../common';

configureJest();
configureFirebase();

const adminApp = initializeAdmin();

describe('get-blob', () => {
  test.each<[string, string, FirebaseFirestore.DocumentData, Buffer, string]>([
    [
      'collection/document',
      'field',
      { field: Buffer.from([0x62, 0x75, 0x66, 0x66, 0x65, 0x72]) },
      Buffer.from([0x62, 0x75, 0x66, 0x66, 0x65, 0x72]),
      'collection_document_field.bin',
    ],
    [
      'collection1/document1/collection2/document2',
      'field1.field2.field3.field4',
      { field1: { field2: { field3: { field4: Buffer.from([0x62, 0x75, 0x66, 0x66, 0x65, 0x72]) } } } },
      Buffer.from([0x62, 0x75, 0x66, 0x66, 0x65, 0x72]),
      'collection1_document1_collection2_document2_field1_field2_field3_field4.bin',
    ],
  ])(
    "%s %s (when the document is '%j')",
    async (documentPath, fieldPath, document, expectedBuffer, expectedFilename) => {
      // Prepare a document for testing.
      await adminApp.firestore().doc(documentPath).set(document);

      // Test.
      await getBlobCommandHandler(adminApp, documentPath, fieldPath);

      const buffer = await fsp.readFile(expectedFilename);
      expect(buffer).toEqual(expectedBuffer);

      // Delete the created file.
      await fsp.rm(expectedFilename);
    }
  );

  test('no document path provided', async () => {
    await expect(() => getBlobCommandHandler(adminApp, undefined, undefined)).rejects.toThrow(
      'Provide a slash-separated document path to download.'
    );
  });

  test('no field path provided', async () => {
    await expect(() => getBlobCommandHandler(adminApp, 'collection/document', undefined)).rejects.toThrow(
      'Provide a dot-separated field path to download.'
    );
  });

  test('non-existent collection', async () => {
    await adminApp.firestore().doc('collection/document').set({ field: 'value' });

    await expect(() => getBlobCommandHandler(adminApp, 'nonExistentCollection/document', 'field')).rejects.toThrow(
      'The document "nonExistentCollection/document" does not exist.'
    );
  });

  test('non-existent document', async () => {
    await adminApp.firestore().doc('collection/document').set({ field: 'value' });

    await expect(() => getBlobCommandHandler(adminApp, 'collection/nonExistentDocument', 'field')).rejects.toThrow(
      'The document "collection/nonExistentDocument" does not exist.'
    );
  });

  test('non-existent field', async () => {
    await adminApp.firestore().doc('collection/document').set({ field: 'value' });

    await expect(() => getBlobCommandHandler(adminApp, 'collection/document', 'nonExistentField')).rejects.toThrow(
      'The field "nonExistentField" does not exist in the document "collection/document".'
    );
  });
});

import fsp from 'fs/promises';

import { initializeAdmin } from '../../src/firebaseAdmin';
import { getBlobFieldAndWriteFile, getField } from '../../src/getBlobCommand';
import { configureFirebase, configureJest } from '../common';

configureJest();
configureFirebase();

const adminApp = initializeAdmin();

describe('getBlobFieldAndWriteFile', () => {
  test.each<[string, string, FirebaseFirestore.DocumentData, Buffer, string]>([
    [
      'collection/document',
      'field',
      { field: Buffer.from([0x62, 0x75, 0x66, 0x66, 0x65, 0x72]) },
      Buffer.from([0x62, 0x75, 0x66, 0x66, 0x65, 0x72]),
      'collection_document_field.bin',
    ],
    [
      'collection/document',
      'field1.field2.field3.field4',
      { field1: { field2: { field3: { field4: Buffer.from('this is a test') } } } },
      Buffer.from('this is a test'),
      'collection_document_field1_field2_field3_field4.bin',
    ],
  ])('(%j, %j, %j, %j)', async (documentPath, fieldPath, document, expectedBuffer, expectedFilename) => {
    // Prepare a document for testing.
    await adminApp.firestore().doc(documentPath).set(document);

    // Test.
    await getBlobFieldAndWriteFile(adminApp, documentPath, fieldPath);

    const buffer = await fsp.readFile(expectedFilename);
    expect(buffer).toEqual(expectedBuffer);

    // Delete the created file.
    await fsp.rm(expectedFilename);
  });

  test('no document path provided', async () => {
    await expect(() => getBlobFieldAndWriteFile(adminApp, undefined, undefined)).rejects.toThrow(
      'Provide a slash-separated document path to download.'
    );
  });

  test('no field path provided', async () => {
    await expect(() => getBlobFieldAndWriteFile(adminApp, 'collection/document', undefined)).rejects.toThrow(
      'Provide a dot-separated field path to download.'
    );
  });
});

describe('getField', () => {
  test.each<[string, string, FirebaseFirestore.DocumentData, any]>([
    ['collection/document', 'field', { field: 'string' }, 'string'],
    [
      'collection/document',
      'field',
      { field: Buffer.from([0x62, 0x75, 0x66, 0x66, 0x65, 0x72]) },
      Buffer.from([0x62, 0x75, 0x66, 0x66, 0x65, 0x72]),
    ],
    [
      'collection/document/collection/document',
      'field1.field2.field3.field4',
      { field1: { field2: { field3: { field4: 1 } } } },
      1,
    ],
  ])('(%j, %j, %j, %j)', async (documentPath, fieldPath, document, expectedField) => {
    // Prepare a document for testing.
    await adminApp.firestore().doc(documentPath).set(document);

    // Test.
    const field = await getField(adminApp, documentPath, fieldPath);
    expect(field).toEqual(expectedField);
  });

  test('non-existent collection', async () => {
    await adminApp.firestore().doc('collection/document').set({ field: 'value' });

    await expect(() => getField(adminApp, 'nonExistentCollection/document', 'field')).rejects.toThrow(
      'The document "nonExistentCollection/document" does not exist.'
    );
  });

  test('non-existent document', async () => {
    await adminApp.firestore().doc('collection/document').set({ field: 'value' });

    await expect(() => getField(adminApp, 'collection/nonExistentDocument', 'field')).rejects.toThrow(
      'The document "collection/nonExistentDocument" does not exist.'
    );
  });

  test('non-existent field', async () => {
    await adminApp.firestore().doc('collection/document').set({ field: 'value' });

    await expect(() => getField(adminApp, 'collection/document', 'nonExistentField')).rejects.toThrow(
      'The field "nonExistentField" does not exist in the document "collection/document".'
    );
  });
});

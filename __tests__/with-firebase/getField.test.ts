import { initializeAdmin } from '../../src/firebaseAdmin';
import { getField } from '../../src/getBlobCommand';
import { configureFirebase, configureJest } from '../common';

configureJest();
configureFirebase();

const adminApp = initializeAdmin();

type Case = [string, string, FirebaseFirestore.DocumentData, any];

test.each<Case>([
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
])('getField(%j, %j, %j, %j)', async (documentPath, fieldPath, document, expectedField) => {
  // Prepare a document for testing.
  await adminApp.firestore().doc(documentPath).set(document);

  // Test.
  const field = await getField(adminApp, documentPath, fieldPath);
  expect(field).toEqual(expectedField);
});

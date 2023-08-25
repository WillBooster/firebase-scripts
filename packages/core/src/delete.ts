import type { App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const MAX_BATCH_SIZE = 500;

/**
 * Delete documents with batch processing.
 * @param adminApp An app of firebase admin.
 * @param collectionPath A slash-separated collection path to delete.
 * @param documentIds An array of document IDs to delete.
 * @param batchSize An optional batch size.
 */
export async function deleteDocumentsWithBatch(
  adminApp: App,
  collectionPath: string,
  documentIds: string[],
  batchSize = MAX_BATCH_SIZE
): Promise<void> {
  batchSize = Math.min(Math.max(batchSize, 1), MAX_BATCH_SIZE);
  const db = await getFirestore(adminApp);
  let batch = db.batch();

  for (let i = 0; i < documentIds.length; i++) {
    const docRef = db.collection(collectionPath).doc(documentIds[i]);
    batch.delete(docRef);

    // If batch size reached or it's the last ID
    if ((i + 1) % batchSize === 0 || i === documentIds.length - 1) {
      await batch.commit();

      // Reset the batch
      batch = db.batch();
    }
  }
}

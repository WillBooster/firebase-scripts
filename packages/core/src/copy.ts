import { App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

export async function copyDocument(
  sourceAdminApp: App,
  sourceDocumentPath: string,
  targetAdminApp: App,
  targetDocumentPath: string
): Promise<void> {
  console.info(`Reading the source document '${sourceDocumentPath}'...`);
  const docSnapshot = await getFirestore(sourceAdminApp).doc(sourceDocumentPath).get();
  const docData = docSnapshot.data();
  if (!docData) {
    console.error(`The source document '${sourceDocumentPath}' does not exist.`);
    return;
  }

  console.info(`Writing the target document '${targetDocumentPath}'...'`);
  await getFirestore(targetAdminApp).doc(targetDocumentPath).set(docData);
}

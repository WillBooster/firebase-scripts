import { app } from 'firebase-admin';

export async function copyDocument(
  sourceAdminApp: app.App,
  sourceDocumentPath: string,
  targetAdminApp: app.App,
  targetDocumentPath: string
): Promise<void> {
  console.info(`Reading the source document '${sourceDocumentPath}'...`);
  const docSnapshot = await sourceAdminApp.firestore().doc(sourceDocumentPath).get();
  const docData = docSnapshot.data();
  if (!docData) {
    console.error(`The source document '${sourceDocumentPath}' does not exist.`);
    return;
  }

  console.info(`Writing the target document '${targetDocumentPath}'...'`);
  await targetAdminApp.firestore().doc(targetDocumentPath).set(docData);
}

import admin from 'firebase-admin';

interface InitializeAdminOptions {
  name?: string;
  serviceAccountPathOrObject?: string | admin.ServiceAccount;
}

export function initializeAdmin(options?: InitializeAdminOptions): admin.app.App {
  if (
    !options?.serviceAccountPathOrObject &&
    (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_PRIVATE_KEY || !process.env.FIREBASE_CLIENT_EMAIL)
  ) {
    return admin.initializeApp(undefined, options?.name);
  }

  return admin.initializeApp(
    {
      credential: admin.credential.cert(
        options?.serviceAccountPathOrObject ??
          ({
            type: 'service_account',
            project_id: process.env.FIREBASE_PROJECT_ID,
            private_key: process.env.FIREBASE_PRIVATE_KEY,
            client_email: process.env.FIREBASE_CLIENT_EMAIL,
          } as any)
      ),
    },
    options?.name
  );
}

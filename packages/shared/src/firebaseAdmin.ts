import { initializeApp, App, cert, ServiceAccount } from 'firebase-admin/app';

interface InitializeAdminOptions {
  name?: string;
  serviceAccountPathOrObject?: string | ServiceAccount;
}

export function initializeAdmin(options?: InitializeAdminOptions): App {
  if (
    !options?.serviceAccountPathOrObject &&
    (!process.env.GCLOUD_PROJECT || !process.env.FIREBASE_PRIVATE_KEY || !process.env.FIREBASE_CLIENT_EMAIL)
  ) {
    return initializeApp(undefined, options?.name);
  }

  return initializeApp(
    {
      credential: cert(
        options?.serviceAccountPathOrObject ??
          ({
            type: 'service_account',
            project_id: process.env.GCLOUD_PROJECT,
            private_key: process.env.FIREBASE_PRIVATE_KEY,
            client_email: process.env.FIREBASE_CLIENT_EMAIL,
          } as any)
      ),
    },
    options?.name
  );
}

import { FirebaseApp, initializeApp } from 'firebase/app';
import { Auth, getAuth, GoogleAuthProvider } from 'firebase/auth';
import { doc, Firestore, getDocFromServer, getFirestore } from 'firebase/firestore';

const cleanVal = (val?: string): string => {
  if (!val) return '';
  const trimmed = val.trim();
  if (!trimmed || trimmed === '0' || trimmed === 'undefined' || trimmed === 'null') return '';
  return trimmed;
};

const localFallback = __LOCAL_FIREBASE_CONFIG__ || {};

const resolvedProjectId =
  cleanVal(import.meta.env.VITE_FIREBASE_PROJECT_ID) || cleanVal(localFallback.projectId);

const firebaseConfig = {
  apiKey: cleanVal(import.meta.env.VITE_FIREBASE_API_KEY) || cleanVal(localFallback.apiKey),
  authDomain:
    cleanVal(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN) ||
    cleanVal(localFallback.authDomain) ||
    (resolvedProjectId ? `${resolvedProjectId}.firebaseapp.com` : ''),
  projectId: resolvedProjectId,
  storageBucket:
    cleanVal(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET) ||
    cleanVal(localFallback.storageBucket) ||
    (resolvedProjectId ? `${resolvedProjectId}.firebasestorage.app` : ''),
  messagingSenderId:
    cleanVal(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID) ||
    cleanVal(localFallback.messagingSenderId),
  appId: cleanVal(import.meta.env.VITE_FIREBASE_APP_ID) || cleanVal(localFallback.appId),
  measurementId:
    cleanVal(import.meta.env.VITE_FIREBASE_MEASUREMENT_ID) || cleanVal(localFallback.measurementId),
};

const firestoreDatabaseId =
  cleanVal(import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID) ||
  cleanVal(localFallback.firestoreDatabaseId);

export const missingFirebaseEnvVars: string[] = [
  ...(!firebaseConfig.apiKey ? ['VITE_FIREBASE_API_KEY'] : []),
  ...(!firebaseConfig.projectId ? ['VITE_FIREBASE_PROJECT_ID'] : []),
  ...(!firebaseConfig.appId ? ['VITE_FIREBASE_APP_ID'] : []),
];

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId
);

let app: FirebaseApp | null = null;
let dbInstance: Firestore | null = null;
let authInstance: Auth | null = null;
let googleProviderInstance: GoogleAuthProvider | null = null;

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig);
  dbInstance = firestoreDatabaseId ? getFirestore(app, firestoreDatabaseId) : getFirestore(app);
  authInstance = getAuth(app);
  googleProviderInstance = new GoogleAuthProvider();
}

export const db = dbInstance;
export const auth = authInstance;
export const googleProvider = googleProviderInstance;

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo:
        auth?.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  if (!dbInstance) return;
  try {
    await getDocFromServer(doc(dbInstance, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

void testConnection();

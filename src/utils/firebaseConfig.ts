export interface RawFirebaseConfigInput {
  apiKey?: unknown;
  authDomain?: unknown;
  projectId?: unknown;
  storageBucket?: unknown;
  messagingSenderId?: unknown;
  appId?: unknown;
  firestoreDatabaseId?: unknown;
  measurementId?: unknown;
}

export interface ResolvedFirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  firestoreDatabaseId: string;
  measurementId: string;
}

const PLACEHOLDER_TOKENS = new Set([
  '0',
  'undefined',
  'null',
  'YOUR_FIREBASE_API_KEY',
  'YOUR_PROJECT_ID',
  'YOUR_FIREBASE_APP_ID',
  'YOUR_MESSAGING_SENDER_ID',
  'YOUR_FIRESTORE_DATABASE_ID',
  'remixed-project-id',
  'remixed-firestore-database-id',
]);

function normalizeStr(val: unknown): string {
  if (typeof val !== 'string') return '';
  const trimmed = val.trim();
  if (!trimmed || PLACEHOLDER_TOKENS.has(trimmed)) return '';
  if (/^YOUR_/i.test(trimmed)) return '';
  return trimmed;
}

export function cleanApiKey(val: unknown): string {
  const s = normalizeStr(val);
  return /^AIza[0-9A-Za-z_-]{20,}$/.test(s) ? s : '';
}

export function cleanProjectId(val: unknown): string {
  const s = normalizeStr(val);
  return /^[a-z][a-z0-9-]{4,30}[a-z0-9]$/.test(s) ? s : '';
}

export function cleanDomain(val: unknown): string {
  const s = normalizeStr(val);
  if (!s || s.includes('://') || s.includes('/')) return '';
  return /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(s) ? s : '';
}

export function cleanSenderId(val: unknown): string {
  const s = normalizeStr(val);
  return /^\d{6,20}$/.test(s) ? s : '';
}

export function cleanAppId(val: unknown): string {
  const s = normalizeStr(val);
  return /^\d+:\d+:(web|android|ios):[0-9a-fA-F]+$/.test(s) ? s : '';
}

export function cleanMeasurementId(val: unknown): string {
  const s = normalizeStr(val);
  return /^(G|UA|AW|DC)-[0-9A-Za-z-]+$/.test(s) ? s : '';
}

export function cleanDatabaseId(val: unknown): string {
  const s = normalizeStr(val);
  if (!s || s.includes('://') || s.includes('/')) return '';
  return /^(\(default\)|[a-z][a-z0-9-]{2,62}[a-z0-9])$/.test(s) ? s : '';
}

export function resolveFirebaseConfig(
  primary: RawFirebaseConfigInput,
  fallback: RawFirebaseConfigInput = {}
): ResolvedFirebaseConfig {
  const projectId = cleanProjectId(primary.projectId) || cleanProjectId(fallback.projectId);
  const apiKey = cleanApiKey(primary.apiKey) || cleanApiKey(fallback.apiKey);
  const authDomain =
    cleanDomain(primary.authDomain) ||
    cleanDomain(fallback.authDomain) ||
    (projectId ? `${projectId}.firebaseapp.com` : '');
  const storageBucket =
    cleanDomain(primary.storageBucket) ||
    cleanDomain(fallback.storageBucket) ||
    (projectId ? `${projectId}.firebasestorage.app` : '');
  const messagingSenderId =
    cleanSenderId(primary.messagingSenderId) || cleanSenderId(fallback.messagingSenderId);
  const appId = cleanAppId(primary.appId) || cleanAppId(fallback.appId);
  const measurementId =
    cleanMeasurementId(primary.measurementId) || cleanMeasurementId(fallback.measurementId);

  const primaryDb = cleanDatabaseId(primary.firestoreDatabaseId);
  const fallbackDb = cleanDatabaseId(fallback.firestoreDatabaseId);
  const primaryDbMatchesProjectId = Boolean(
    primaryDb && projectId && primaryDb === projectId && fallbackDb && fallbackDb !== projectId
  );
  const firestoreDatabaseId = primaryDbMatchesProjectId
    ? fallbackDb
    : primaryDb || fallbackDb;

  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
    firestoreDatabaseId,
    measurementId,
  };
}

/**
 * Centralized, lazy-loaded Firebase initialization module.
 *
 * Key architectural guarantees:
 * - Zero Firebase SDK network overhead on initial page load (dynamic imports).
 * - Singleton initialization with automatic cache invalidation on failure (retry-safe).
 * - Eliminates auth race conditions via `auth.authStateReady()`.
 * - Strict timeout protection so callers never hang indefinitely.
 */

const FIREBASE_SDK_VERSION = '11.6.1';
const FIREBASE_CDN_BASE = `https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}`;
const INIT_TIMEOUT_MS = 10_000;
const CONFIG_FETCH_TIMEOUT_MS = 5_000;

/**
 * Cached initialization promise. Reset to `null` if initialization fails
 * so subsequent user actions can cleanly retry.
 * @type {Promise<FirebaseServices> | null}
 */
let initPromise = null;

/**
 * @typedef {Object} FirebaseServices
 * @property {import('firebase/firestore').Firestore} db
 * @property {import('firebase/auth').Auth} auth
 * @property {string} appId
 * @property {{
 *   collection: Function,
 *   addDoc: Function,
 *   serverTimestamp: Function
 * }} firestore
 */

/**
 * Races a promise against a timeout to guarantee settlement.
 *
 * @template T
 * @param {Promise<T>} promise
 * @param {number} timeoutMs
 * @param {string} errorMessage
 * @returns {Promise<T>}
 */
function withTimeout(promise, timeoutMs, errorMessage) {
    let timeoutId;

    const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
            reject(new Error(errorMessage));
        }, timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]).finally(() => {
        clearTimeout(timeoutId);
    });
}

/**
 * Resolves Firebase configuration from injected global variable
 * or Firebase Hosting's auto-generated `/__/firebase/init.json`.
 *
 * @returns {Promise<Record<string, any>>}
 */
async function resolveFirebaseConfig() {
    // 1. Check for injected global config (custom / preview environments)
    if (typeof globalThis.__firebase_config !== 'undefined') {
        try {
            const parsed = typeof globalThis.__firebase_config === 'string'
                ? JSON.parse(globalThis.__firebase_config)
                : globalThis.__firebase_config;

            if (parsed?.apiKey) {
                return parsed;
            }
        } catch (error) {
            console.error('[Firebase] Failed to parse __firebase_config:', error);
        }
    }

    // 2. Fallback to Firebase Hosting auto-config endpoint
    const controller = new AbortController();
    const fetchTimeout = setTimeout(() => controller.abort(), CONFIG_FETCH_TIMEOUT_MS);

    try {
        const response = await fetch('/__/firebase/init.json', {
            signal: controller.signal,
            credentials: 'same-origin'
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status} while fetching /__/firebase/init.json`);
        }

        const config = await response.json();
        if (!config?.apiKey) {
            throw new Error('Firebase config is missing required "apiKey" field.');
        }

        return config;
    } finally {
        clearTimeout(fetchTimeout);
    }
}

/**
 * Performs one-time dynamic loading of Firebase SDK modules, initializes
 * App/Auth/Firestore, and ensures an authenticated session exists.
 *
 * @returns {Promise<FirebaseServices>}
 */
async function bootstrapFirebase() {
    // Fetch config and load SDK modules concurrently to minimize latency
    const [firebaseConfig, appModule, authModule, firestoreModule] = await Promise.all([
        resolveFirebaseConfig(),
        import(`${FIREBASE_CDN_BASE}/firebase-app.js`),
        import(`${FIREBASE_CDN_BASE}/firebase-auth.js`),
        import(`${FIREBASE_CDN_BASE}/firebase-firestore.js`)
    ]);

    const { initializeApp, getApps, getApp } = appModule;
    const { getAuth, signInAnonymously, signInWithCustomToken } = authModule;
    const { getFirestore, collection, addDoc, serverTimestamp } = firestoreModule;

    // Reuse existing app instance if already initialized (e.g., after partial retry)
    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    const appId =
        firebaseConfig.appId ||
        (typeof globalThis.__app_id !== 'undefined' ? globalThis.__app_id : 'default-app-id');

    // Wait for persisted auth state to settle before checking currentUser
    await auth.authStateReady();

    if (!auth.currentUser) {
        if (typeof globalThis.__initial_auth_token === 'string' && globalThis.__initial_auth_token) {
            await signInWithCustomToken(auth, globalThis.__initial_auth_token);
        } else {
            await signInAnonymously(auth);
        }
    }

    return Object.freeze({
        db,
        auth,
        appId,
        firestore: Object.freeze({
            collection,
            addDoc,
            serverTimestamp
        })
    });
}

/**
 * Returns initialized and authenticated Firebase services.
 * Safe to call multiple times concurrently; retries automatically if a previous attempt failed.
 *
 * @returns {Promise<FirebaseServices>}
 */
export function getFirebaseServices() {
    if (!initPromise) {
        initPromise = withTimeout(
            bootstrapFirebase(),
            INIT_TIMEOUT_MS,
            `Firebase initialization timed out after ${INIT_TIMEOUT_MS}ms.`
        ).catch((error) => {
            // Invalidate cache on failure so the user can retry on next submission
            initPromise = null;
            throw error;
        });
    }

    return initPromise;
}

/**
 * Non-blocking warm-up trigger. Call on first form interaction (e.g., `focusin`)
 * so Firebase SDK and Auth are ready before the user clicks Submit.
 */
export function preloadFirebaseServices() {
    getFirebaseServices().catch(() => {
        // Silent catch: actual errors will be surfaced if/when the user submits the form
    });
}

/**
 * High-level helper to write a document to a Firestore collection with a server timestamp.
 * Keeps page scripts decoupled from direct Firebase CDN imports.
 *
 * @param {string} collectionName - Target Firestore collection name
 * @param {Record<string, any>} payload - Document fields (excluding `createdAt`)
 * @returns {Promise<import('firebase/firestore').DocumentReference>}
 */
export async function createFirestoreDocument(collectionName, payload) {
    const { db, firestore } = await getFirebaseServices();
    const { collection, addDoc, serverTimestamp } = firestore;

    return addDoc(collection(db, collectionName), {
        ...payload,
        createdAt: serverTimestamp()
    });
}

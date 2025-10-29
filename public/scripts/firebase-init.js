/*
 * This script handles the centralized initialization of Firebase services
 * and provides a simple, resolved export of the key variables.
 */

// Import SDK functions
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { 
    getAuth, 
    signInAnonymously, 
    signInWithCustomToken, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { 
    getFirestore, 
    setLogLevel
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- Module-level variables ---
let db, auth, appId;
let isAuthReady = false;
let authResolve;

// Create a promise that other modules can wait on
const authReadyPromise = new Promise((resolve) => {
    authResolve = resolve;
});

/**
 * Asynchronously initializes Firebase and signs in the user.
 * This function is called immediately when the module is loaded.
 */
async function initializeFirebaseAndAuth() {
    try {
        // --- 1. Get Config and App ID ---
        // These constants are provided by the Canvas environment.
        appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
        const firebaseConfigStr = typeof __firebase_config !== 'undefined' ? __firebase_config : '{}';
        const firebaseConfig = JSON.parse(firebaseConfigStr);

        if (!firebaseConfig.apiKey) {
            console.error("Firebase config is missing or invalid.");
            return;
        }

        // --- 2. Initialize Firebase App ---
        const app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);

        // Enable Firestore debug logging
        setLogLevel('Debug');

        // --- 3. Set up Auth Listener ---
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                // User is signed in.
                console.log("Firebase Auth: User is signed in.", user.uid);
                // If auth wasn't already marked as ready, resolve the promise.
                if (!isAuthReady) {
                    isAuthReady = true;
                    authResolve({ db, auth, appId });
                }
            } else {
                // User is signed out. Try to sign in.
                console.log("Firebase Auth: No user found, attempting sign-in...");
                await attemptSignIn();
            }
        });

        // Initial check, in case onAuthStateChanged doesn't fire immediately
        if (!auth.currentUser) {
            await attemptSignIn();
        }

    } catch (error) {
        console.error("Error during Firebase initialization:", error);
    }
}

/**
 * Attempts to sign in using Custom Token or falls back to Anonymous.
 */
async function attemptSignIn() {
    try {
        // Use __initial_auth_token if available (Canvas environment)
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            console.log("Attempting sign-in with custom token...");
            await signInWithCustomToken(auth, __initial_auth_token);
        } else {
            // Fallback for local testing or when token is not present
            console.log("Attempting anonymous sign-in...");
            await signInAnonymously(auth);
        }
    } catch (error) {
        console.error("Firebase sign-in error:", error);
    }
}

// --- Module Execution ---
// Start the initialization process as soon as this module is imported.
// We call the function directly and don't assign its result, fixing the no-unused-vars.
initializeFirebaseAndAuth();

// --- Exports ---
// Export the variables directly.
// Note: Other modules should wait for `authReadyPromise` if they need 
// to use `db` or `auth` immediately on load.
export { db, auth, appId, authReadyPromise };

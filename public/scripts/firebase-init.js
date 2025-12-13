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
        let firebaseConfig;

        // --- 1. Get Config ---
        // Спроба А: Перевіряємо глобальну змінну (часто використовується в custom environments)
        if (typeof __firebase_config !== 'undefined') {
            try {
                firebaseConfig = JSON.parse(__firebase_config);
            } catch (e) {
                console.error("Error parsing __firebase_config:", e);
            }
        }

        // Спроба Б: Якщо змінної немає, тягнемо стандартний файл конфігурації Firebase Hosting.
        // Це працює і локально (firebase serve), і на продакшені.
        if (!firebaseConfig) {
            try {
                const response = await fetch('/__/firebase/init.json');
                if (response.ok) {
                    firebaseConfig = await response.json();
                } else {
                    console.warn("Could not fetch /__/firebase/init.json. Status:", response.status);
                }
            } catch (e) {
                console.warn("Fetch error for firebase config:", e);
            }
        }

        // Якщо конфіг так і не знайшли — зупиняємось
        if (!firebaseConfig || !firebaseConfig.apiKey) {
            console.error("Firebase config is missing or invalid. Check your setup.");
            return;
        }

        // Отримуємо App ID з конфігу або глобальної змінної
        appId = firebaseConfig.appId || (typeof __app_id !== 'undefined' ? __app_id : 'default-app-id');

        // --- 2. Initialize Firebase App ---
        const app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);

        // Enable Firestore debug logging (optional, helpful for dev)
        // setLogLevel('Debug');

        // --- 3. Set up Auth Listener ---
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                // User is signed in.
                console.log("Firebase Auth: User is signed in.", user.uid);
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

        // Initial check
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
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            console.log("Attempting sign-in with custom token...");
            await signInWithCustomToken(auth, __initial_auth_token);
        } else {
            console.log("Attempting anonymous sign-in...");
            await signInAnonymously(auth);
        }
    } catch (error) {
        console.error("Firebase sign-in error:", error);
    }
}

// --- Module Execution ---
initializeFirebaseAndAuth();

// --- Exports ---
export { db, auth, appId, authReadyPromise };

/**
 * Shared, production-grade controller for public Firestore-backed forms.
 *
 * Responsibilities:
 * - Lazy-warms Firebase SDK on first user interaction (`focusin`).
 * - Prevents duplicate submissions via an explicit state lock + `aria-busy`.
 * - Handles honeypot bot trapping without polluting analytics or Firestore.
 * - Guards against Firestore's offline write-queuing hang with a strict timeout.
 * - Preserves i18n-translated error messages across validation and network failures.
 */

import {
    createFirestoreDocument,
    preloadFirebaseServices
} from './firebase-init.js';

const DEFAULT_SUBMIT_TIMEOUT_MS = 12_000;
const MAX_USER_AGENT_LENGTH = 300;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Validates an email address format and reasonable length (RFC 5321 cap).
 *
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
    if (typeof email !== 'string') return false;
    const trimmed = email.trim();
    return trimmed.length > 0 && trimmed.length <= 254 && EMAIL_REGEX.test(trimmed);
}

/**
 * Races an async operation against a timeout so UI state always settles.
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
 * Attaches standardized submission, validation, honeypot, and loading-state
 * handling to a form that persists data into a Firestore collection.
 *
 * @param {Object} config
 * @param {HTMLFormElement} config.form - Target form element
 * @param {string} config.collectionName - Destination Firestore collection
 * @param {string} [config.honeypotSelector] - Selector for hidden bot-trap input
 * @param {HTMLButtonElement} config.submitBtn - Submit button element
 * @param {HTMLElement | null} [config.btnTextDefault] - Default button label
 * @param {HTMLElement | null} [config.btnTextLoading] - Loading button label
 * @param {HTMLElement | null} [config.spinner] - Loading spinner SVG/element
 * @param {HTMLElement | null} [config.errorContainer] - Error banner/message wrapper
 * @param {HTMLElement | null} [config.errorTextEl] - Specific text node inside errorContainer
 * @param {(form: HTMLFormElement) => { valid: true, data: Record<string, any> } | { valid: false, focusEl?: HTMLElement | null, message?: string }} config.buildPayload
 * @param {(context: { isBot: boolean }) => void} config.onSuccess
 * @param {(error: Error) => void} [config.onError]
 * @param {number} [config.submitTimeoutMs]
 * @returns {{ resetButtonState: () => void, clearError: () => void, destroy: () => void } | null}
 */
export function attachFirestoreForm(config) {
    const {
        form,
        collectionName,
        honeypotSelector,
        submitBtn,
        btnTextDefault = null,
        btnTextLoading = null,
        spinner = null,
        errorContainer = null,
        errorTextEl = errorContainer,
        buildPayload,
        onSuccess,
        onError,
        submitTimeoutMs = DEFAULT_SUBMIT_TIMEOUT_MS
    } = config;

    if (!form || !submitBtn || typeof buildPayload !== 'function' || typeof onSuccess !== 'function') {
        console.error('[FormHandler] Missing required configuration for form:', collectionName);
        return null;
    }

    const controller = new AbortController();
    const { signal } = controller;

    let isSubmitting = false;
    /**
     * Lazily captured i18n-translated generic error string so temporary
     * validation overrides never permanently overwrite localized text.
     * @type {string | null}
     */
    let defaultErrorText = null;

    function setLoadingState(loading) {
        submitBtn.disabled = loading;
        submitBtn.setAttribute('aria-busy', String(loading));

        if (btnTextDefault) btnTextDefault.classList.toggle('hidden', loading);
        if (btnTextLoading) btnTextLoading.classList.toggle('hidden', !loading);
        if (spinner) spinner.classList.toggle('hidden', !loading);
    }

    function clearError() {
        if (!errorContainer) return;
        errorContainer.classList.add('hidden');

        if (errorTextEl && defaultErrorText !== null) {
            errorTextEl.textContent = defaultErrorText;
        }
    }

    /**
     * Displays the error banner. If no custom message is provided, ensures the
     * original localized fallback message is shown.
     *
     * @param {string} [customMessage]
     */
    function showError(customMessage) {
        if (!errorContainer) return;

        if (errorTextEl) {
            if (defaultErrorText === null) {
                defaultErrorText = errorTextEl.textContent;
            }
            errorTextEl.textContent = customMessage || defaultErrorText;
        }

        errorContainer.classList.remove('hidden');
    }

    // Warm up Firebase SDK & Auth silently on the user's first interaction with the form
    form.addEventListener(
        'focusin',
        () => {
            preloadFirebaseServices();
        },
        { once: true, signal }
    );

    // Dismiss visible errors as soon as the user starts correcting inputs
    form.addEventListener(
        'input',
        () => {
            if (errorContainer && !errorContainer.classList.contains('hidden')) {
                clearError();
            }
        },
        { signal }
    );

    form.addEventListener(
        'submit',
        async (event) => {
            event.preventDefault();

            // Guard against programmatic or rapid double submits
            if (isSubmitting) return;

            clearError();

            // 1. Honeypot bot check: simulate success silently without DB write or analytics
            if (honeypotSelector) {
                const honeypotInput = form.querySelector(honeypotSelector);
                if (honeypotInput && honeypotInput.value.trim().length > 0) {
                    onSuccess({ isBot: true });
                    return;
                }
            }

            // 2. Form-specific validation and payload construction
            const result = buildPayload(form);
            if (!result || !result.valid) {
                showError(result?.message);
                if (result?.focusEl && typeof result.focusEl.focus === 'function') {
                    result.focusEl.focus();
                }
                return;
            }

            // 3. Fast-fail if browser explicitly reports offline state
            if (typeof navigator !== 'undefined' && navigator.onLine === false) {
                showError();
                return;
            }

            isSubmitting = true;
            setLoadingState(true);

            try {
                const payload = {
                    ...result.data,
                    locale: document.documentElement.lang || 'en',
                    pagePath: window.location.pathname,
                    userAgent: (navigator.userAgent || '').slice(0, MAX_USER_AGENT_LENGTH)
                };

                await withTimeout(
                    createFirestoreDocument(collectionName, payload),
                    submitTimeoutMs,
                    `Firestore write to "${collectionName}" timed out after ${submitTimeoutMs}ms.`
                );

                onSuccess({ isBot: false });
            } catch (error) {
                console.error(`[FormHandler] Failed to submit "${collectionName}":`, error);
                showError();
                if (typeof onError === 'function') {
                    onError(error);
                }
            } finally {
                isSubmitting = false;
                setLoadingState(false);
            }
        },
        { signal }
    );

    return {
        resetButtonState: () => setLoadingState(false),
        clearError,
        destroy: () => controller.abort()
    };
}
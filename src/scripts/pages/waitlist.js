// public/js/pages/waitlist.js

import { attachFirestoreForm, isValidEmail } from '../services/form-handler.js';

/**
 * Transitions the waitlist UI from the form state to the animated success view.
 *
 * @param {HTMLElement} container
 * @param {HTMLElement} successMessage
 */
function showSuccessUI(container, successMessage) {
    container.style.opacity = '0';

    setTimeout(() => {
        container.classList.add('hidden');
        successMessage.classList.remove('hidden');

        // Trigger CSS fade-in and slide-up transition on the next frame
        requestAnimationFrame(() => {
            successMessage.classList.remove('opacity-0', 'translate-y-4');
        });
    }, 500);
}

/**
 * Initializes the Waitlist form via the shared Firestore form handler.
 */
function setupWaitlistForm() {
    const form = document.getElementById('waitlist-form');
    const container = document.getElementById('waitlist-container');
    const successMessage = document.getElementById('waitlist-success-message');
    const failureMessage = document.getElementById('waitlist-failure-message');
    const failureText = document.getElementById('failure-error-text');
    const submitBtn = document.getElementById('submit-btn');

    if (!form || !submitBtn || !container || !successMessage) return;

    const emailInput = document.getElementById('email');
    const nameInput = document.getElementById('name');
    const commentInput = document.getElementById('comment');

    attachFirestoreForm({
        form,
        collectionName: 'waitlist',
        honeypotSelector: '#b_phone',
        submitBtn,
        btnTextDefault: document.getElementById('btn-text-default'),
        btnTextLoading: document.getElementById('btn-text-loading'),
        spinner: document.getElementById('loading-spinner'),
        errorContainer: failureMessage,
        errorTextEl: failureText,
        buildPayload: () => {
            const email = emailInput?.value.trim() || '';
            const name = nameInput?.value.trim() || '';
            const comment = commentInput?.value.trim() || '';

            // Rely on localized fallback message instead of hardcoded English strings
            if (!isValidEmail(email)) {
                return { valid: false, focusEl: emailInput };
            }

            return {
                valid: true,
                data: {
                    email,
                    name: name || null,
                    comment: comment || null,
                    source: 'landing-page'
                }
            };
        },
        onSuccess: ({ isBot }) => {
            // Only track real conversions in GA4; never count honeypot-trapped bots
            if (!isBot && typeof window.gtag === 'function') {
                window.gtag('event', 'generate_lead', {
                    event_category: 'conversion',
                    event_label: 'Waitlist Signup',
                    value: 1.0
                });
            }

            showSuccessUI(container, successMessage);
        }
    });
}

// Module scripts are deferred, so handle both loading and already-ready states safely
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupWaitlistForm, { once: true });
} else {
    setupWaitlistForm();
}

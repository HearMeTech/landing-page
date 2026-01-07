// public/scripts/page-waitlist.js

// This is the entry point for the Waitlist page.

import { db, authReadyPromise } from './firebase-init.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

async function setupWaitlistForm() {
    const form = document.getElementById('waitlist-form');
    const container = document.getElementById('waitlist-container');
    const successMessage = document.getElementById('waitlist-success-message');
    const failureMessage = document.getElementById('waitlist-failure-message');
    
    const submitBtn = document.getElementById('submit-btn');
    const loadingSpinner = document.getElementById('loading-spinner');
    
    const btnTextDefault = document.getElementById('btn-text-default');
    const btnTextLoading = document.getElementById('btn-text-loading');
    
    const failureText = document.getElementById('failure-error-text');

    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        failureMessage.classList.add('hidden');

        const checkField = document.getElementById('b_phone');
        if (checkField && checkField.value) {
            showSuccessUI(container, successMessage);
            return;
        }

        const emailInput = document.getElementById('email');
        const nameInput = document.getElementById('name');
        const commentInput = document.getElementById('comment');

        const email = emailInput.value.trim();
        const name = nameInput.value.trim();
        const comment = commentInput.value.trim();

        if (!email) {
            showError("Email is required.", failureMessage, failureText);
            return;
        }

        if (!isValidEmail(email)) {
            showError("Please enter a valid email address.", failureMessage, failureText);
            return;
        }

        submitBtn.disabled = true;
        
        if (btnTextDefault) btnTextDefault.classList.add('hidden');
        if (btnTextLoading) btnTextLoading.classList.remove('hidden');
        
        loadingSpinner.classList.remove('hidden');

        try {
            console.log("Waiting for Firebase Auth...");
            await authReadyPromise; 

            console.log("Writing to Firestore...");
            await addDoc(collection(db, "waitlist"), {
                email: email,
                name: name || null,
                comment: comment || null,
                createdAt: serverTimestamp(),
                source: 'landing-page',
                userAgent: navigator.userAgent
            });

            showSuccessUI(container, successMessage);

        } catch (error) {
            console.error("Error adding to waitlist: ", error);
            
            failureMessage.classList.remove('hidden');
            submitBtn.disabled = false;
            if (btnTextDefault) btnTextDefault.classList.remove('hidden');
            if (btnTextLoading) btnTextLoading.classList.add('hidden');
            loadingSpinner.classList.add('hidden');
        }
    });
}

// Helper to show success (used for both humans and bots)
function showSuccessUI(container, successMessage) {
    container.style.opacity = '0';
    setTimeout(() => {
        container.classList.add('hidden'); 
        successMessage.classList.remove('hidden'); 
        requestAnimationFrame(() => {
            successMessage.classList.remove('opacity-0', 'translate-y-4');
        });
    }, 500);
}

// Helper to show specific validation error
function showError(msg, failureMessage, failureText) {
    failureMessage.classList.remove('hidden');
    failureText.textContent = msg;
}

document.addEventListener('DOMContentLoaded', () => {
    setupWaitlistForm();
});

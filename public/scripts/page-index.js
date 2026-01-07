// public/scripts/page-index.js

// Imports for functionality
import { db, authReadyPromise } from './firebase-init.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Configuration
const HERO_TYPING_SPEED = 150;
let activeTypewriterTimeout = null;

/**
 * Initializes Scroll Reveal animation.
 */
function setupScrollReveal() {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15 // Trigger a bit earlier for better feel
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
}

/**
 * Typewriter effect logic.
 */
function typeWriterEffect(element, text, speed = 30) {
    if (!element || !text) return;

    if (activeTypewriterTimeout) {
        clearTimeout(activeTypewriterTimeout);
        activeTypewriterTimeout = null;
    }

    element.innerHTML = '&nbsp;';
    
    let i = 0;
    let isTag = false;
    let currentHTML = '';

    function type() {
        if (i >= text.length) {
            activeTypewriterTimeout = null;
            return;
        }

        const char = text.charAt(i);
        if (char === '<') isTag = true;
        currentHTML += char;
        element.innerHTML = currentHTML; 
        if (char === '>') isTag = false;
        i++;

        if (isTag) {
            type();
        } else {
            activeTypewriterTimeout = setTimeout(type, speed);
        }
    }
    type();
}

function triggerHeroAnimation() {
    const displayElement = document.getElementById('hero-title-display');
    const sourceElement = document.getElementById('hero-title-source');

    if (displayElement && sourceElement) {
        const textToType = sourceElement.innerHTML;
        typeWriterEffect(displayElement, textToType, HERO_TYPING_SPEED);
    }
}

/**
 * Tilt effect for cards and Hero image.
 */
function setupTiltEffect() {
    const cards = document.querySelectorAll('.tilt-card');
    
    cards.forEach(card => {
        const intensity = card.getAttribute('data-tilt-strength') || 20;

        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const xPct = (x / rect.width - 0.5) * intensity; 
            const yPct = (y / rect.height - 0.5) * -intensity; 
            
            card.style.transition = 'none';
            card.style.transform = `perspective(1000px) rotateX(${yPct}deg) rotateY(${xPct}deg) scale3d(1.02, 1.02, 1.02)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transition = 'transform 0.5s ease-out';
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
        });
    });
}

/**
 * Validates email format.
 */
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * Sets up the Contact Form logic (Firebase).
 */
function setupContactForm() {
    const form = document.getElementById('contact-form');
    const formContainer = document.getElementById('contact-form-container');
    const successContainer = document.getElementById('contact-success');
    const resetBtn = document.getElementById('contact-reset-btn');
    const submitBtn = document.getElementById('contact-submit-btn');
    
    // Button text state elements
    const btnTextDefault = document.getElementById('btn-text-default');
    const btnTextLoading = document.getElementById('btn-text-loading');
    
    const spinner = document.getElementById('contact-spinner');
    const errorMsg = document.getElementById('contact-error-msg');

    if (!form) return;

    // Helper to reset button UI to default state
    function resetButtonState() {
        submitBtn.disabled = false;
        if (btnTextDefault) btnTextDefault.classList.remove('hidden');
        if (btnTextLoading) btnTextLoading.classList.add('hidden');
        if (spinner) spinner.classList.add('hidden');
    }

    // Helper to switch to Success View
    function showSuccessState() {
        formContainer.style.opacity = '0';
        setTimeout(() => {
            formContainer.classList.add('hidden');
            successContainer.classList.remove('hidden');
            // Reset button for next time (in case user clicks "Send another")
            resetButtonState(); 
        }, 500);
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorMsg.classList.add('hidden');

        const honeyPot = document.getElementById('contact_hp');
        if (honeyPot && honeyPot.value) {
            showSuccessState();
            return;
        }

        const email = document.getElementById('contact-email').value.trim();
        if (!isValidEmail(email)) {
            // Show error (text comes from HTML data-i18n)
            errorMsg.classList.remove('hidden');
            return;
        }

        // --- UI Loading State START ---
        submitBtn.disabled = true;
        
        // Toggle button text: hide "Send", show "Sending..."
        if (btnTextDefault) btnTextDefault.classList.add('hidden');
        if (btnTextLoading) btnTextLoading.classList.remove('hidden');
        
        if (spinner) spinner.classList.remove('hidden');
        // ------------------------------

        const name = document.getElementById('contact-name').value.trim();
        const message = document.getElementById('contact-message').value.trim();

        try {
            await authReadyPromise; 

            await addDoc(collection(db, "messages"), {
                name: name || "Anonymous",
                email: email,
                message: message,
                createdAt: serverTimestamp(),
                source: 'homepage_contact',
                userAgent: navigator.userAgent
            });

            showSuccessState();

        } catch (error) {
            console.error("Error sending message:", error);
            errorMsg.classList.remove('hidden');
            
            // Revert button state on error
            resetButtonState();
        } 
    });

    // Reset logic ("Send another message")
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            form.reset();
            successContainer.classList.add('hidden');
            
            formContainer.classList.remove('hidden');
            // Small delay to allow display:block to apply before opacity transition
            requestAnimationFrame(() => {
                formContainer.style.opacity = '1';
            });
        });
    }
}

/**
 * Main initialization.
 */
function initPage() {
    const heroTitle = document.getElementById('hero-title-display');
    if (heroTitle) heroTitle.innerHTML = '&nbsp;';

    setupScrollReveal();
    setupTiltEffect();
    setupContactForm(); // Initialize form

    setTimeout(() => triggerHeroAnimation(), 500);

    window.addEventListener('language-changed', () => {
        const displayElement = document.getElementById('hero-title-display');
        if (displayElement) {
            if (activeTypewriterTimeout) {
                clearTimeout(activeTypewriterTimeout);
                activeTypewriterTimeout = null;
            }
            displayElement.innerHTML = '&nbsp;';
        }
        setTimeout(() => triggerHeroAnimation(), 100); 
    });

    console.log("Index page initialized.");
}

// Event-driven init
if (window.hearmeReady) {
    initPage();
} else {
    document.addEventListener('hearme:ready', initPage);
}

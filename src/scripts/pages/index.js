// public/js/pages/index.js

// Imports for functionality
import { db, authReadyPromise } from '../firebase-init.js';
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
function typeWriterEffect(element, text, baseSpeed = 30) {
    if (!element || !text) return;

    if (activeTypewriterTimeout) {
        clearTimeout(activeTypewriterTimeout);
        activeTypewriterTimeout = null;
    }

    element.innerHTML = '';
    
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
            const randomSpeed = baseSpeed + (Math.random() * 50 - 10);
            activeTypewriterTimeout = setTimeout(type, randomSpeed);
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
 * Flip cards logic for mobile (Culture section)
 */
function setupFlipCards() {
    const flipCards = document.querySelectorAll('.flip-card');
    
    flipCards.forEach(card => {
        card.addEventListener('click', function() {
            flipCards.forEach(c => {
                if (c !== card) c.classList.remove('is-flipped');
            });
            card.classList.toggle('is-flipped');
        });
    });

    document.addEventListener('click', function(e) {
        if (!e.target.closest('.flip-card')) {
            flipCards.forEach(c => c.classList.remove('is-flipped'));
        }
    });
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
 * Analytics tracking for CTA clicks.
 */
function setupAnalytics() {
    document.addEventListener('click', (e) => {
        const launchTarget = e.target.closest('[data-analytics="launch-app"]');
        if (launchTarget && typeof window.gtag === 'function') {
            window.gtag('event', 'launch_app_click', {
                'event_category': 'engagement',
                'event_label': 'Global Launch Button'
            });
        }

        const waitlistTarget = e.target.closest('[data-analytics="waitlist-click"]');
        if (waitlistTarget && typeof window.gtag === 'function') {
            window.gtag('event', 'join_waitlist_redirect', {
                'event_category': 'engagement',
                'event_label': 'Pricing Section Redirect'
            });
        }
    });
}

/**
 * Loads the external Hero SVG inline, assigns staggered delays to each puzzle
 * and word layer, and triggers playback on initial load, hover, and click.
 */
async function initHeroSvgAnimation() {
    const stage = document.getElementById('hero-svg-container');
    if (!stage) return;

    const svgUrl = stage.getAttribute('data-svg-src');
    if (!svgUrl) return;

    try {
        const response = await fetch(svgUrl);
        if (!response.ok) return;

        const svgMarkup = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgMarkup, 'image/svg+xml');
        const svgElement = doc.querySelector('svg');

        if (!svgElement) return;

        // Clean fixed width/height attributes so CSS controls responsive scaling cleanly
        svgElement.removeAttribute('width');
        svgElement.removeAttribute('height');

        // Assign staggered delays to puzzles (mouth -> phone)
        const puzzles = svgElement.querySelectorAll('#puzzles > g');
        const puzzleStartDelay = 0.15;
        const puzzleStep = 0.22;
        const puzzleDuration = 0.85;

        puzzles.forEach((puzzle, index) => {
            const delay = puzzleStartDelay + index * puzzleStep;
            puzzle.style.setProperty('--delay', `${delay.toFixed(2)}s`);
        });

        // Calculate when the last puzzle lands, add a 0.45s pause, then stagger words
        const lastPuzzleEnd = puzzleStartDelay + Math.max(0, puzzles.length - 1) * puzzleStep + puzzleDuration;
        const pauseBetweenStages = 0.45;
        const wordsStartDelay = lastPuzzleEnd + pauseBetweenStages;
        const wordStep = 0.13;

        const words = svgElement.querySelectorAll('#words > g');
        words.forEach((word, index) => {
            const delay = wordsStartDelay + index * wordStep;
            word.style.setProperty('--delay', `${delay.toFixed(2)}s`);
        });

        stage.innerHTML = '';
        stage.appendChild(svgElement);

        const playAnimation = () => {
            stage.classList.remove('is-playing');
            // Force browser reflow to cleanly restart CSS keyframe animations
            void stage.offsetWidth;
            stage.classList.add('is-playing');
        };

        // 1. Play once automatically shortly after page load
        setTimeout(playAnimation, 350);

        // 2. Replay on mouse enter (desktop) and tap/click (mobile & desktop)
        stage.addEventListener('mouseenter', playAnimation);
        stage.addEventListener('click', playAnimation);
    } catch {
        // Fail silently if SVG cannot be fetched
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
    setupFlipCards();
    setupContactForm();
    setupAnalytics();
    initHeroSvgAnimation();

    setTimeout(() => triggerHeroAnimation(), 500);
}

// Event-driven init
if (window.hearmeReady) {
    initPage();
} else {
    document.addEventListener('hearme:ready', initPage);
}

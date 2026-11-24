// public/js/pages/index.js

import { attachFirestoreForm, isValidEmail } from '../services/form-handler.js';

// ============================================================================
// Hero Animation Configuration (Single Control Panel)
// ============================================================================
const HERO_ANIMATION_CONFIG = {
    // Typewriter settings (ms)
    TYPING_BASE_SPEED_MS: 150,
    INITIAL_TYPING_DELAY_MS: 500,

    // Pause between the last typed character and the start of SVG animation (ms)
    DELAY_AFTER_TYPING_MS: 900,

    // SVG Puzzle stage settings (seconds — must match CSS duration)
    PUZZLE_START_DELAY_S: 0.10,
    PUZZLE_STEP_S: 0.22,
    PUZZLE_DURATION_S: 0.85,

    // Pause between the last puzzle landing in phone and first word appearing (seconds)
    PAUSE_BETWEEN_STAGES_S: 0.45,

    // SVG Words stage settings (seconds — must match CSS duration)
    WORD_STEP_S: 0.13,
    WORD_DURATION_S: 0.75
};

let activeTypewriterTimeout = null;
let isTypewriterFinished = false;

/**
 * Initializes Scroll Reveal animation using IntersectionObserver.
 */
function setupScrollReveal() {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15 // Trigger a bit earlier for better feel
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
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
 * Dispatches 'hero:typewriter-done' once the full phrase is rendered.
 *
 * @param {HTMLElement} element
 * @param {string} text
 * @param {number} [baseSpeed]
 */
function typeWriterEffect(element, text, baseSpeed = HERO_ANIMATION_CONFIG.TYPING_BASE_SPEED_MS) {
    if (!element || !text) return;

    if (activeTypewriterTimeout) {
        clearTimeout(activeTypewriterTimeout);
        activeTypewriterTimeout = null;
    }

    isTypewriterFinished = false;
    element.innerHTML = '';

    let i = 0;
    let isTag = false;
    let currentHTML = '';

    function type() {
        if (i >= text.length) {
            activeTypewriterTimeout = null;
            isTypewriterFinished = true;
            document.dispatchEvent(new CustomEvent('hero:typewriter-done'));
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

/**
 * Starts the hero headline typewriter animation from the hidden source span.
 */
function triggerHeroAnimation() {
    const displayElement = document.getElementById('hero-title-display');
    const sourceElement = document.getElementById('hero-title-source');

    if (displayElement && sourceElement) {
        const textToType = sourceElement.innerHTML;
        typeWriterEffect(displayElement, textToType, HERO_ANIMATION_CONFIG.TYPING_BASE_SPEED_MS);
    }
}

/**
 * Initializes 3D tilt hover effect for feature and step cards.
 */
function setupTiltEffect() {
    const cards = document.querySelectorAll('.tilt-card');

    cards.forEach((card) => {
        const intensity = Number(card.getAttribute('data-tilt-strength')) || 20;

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
 * Initializes tap-to-flip card behavior for mobile devices (Culture section).
 */
function setupFlipCards() {
    const flipCards = document.querySelectorAll('.flip-card');

    flipCards.forEach((card) => {
        card.addEventListener('click', () => {
            flipCards.forEach((c) => {
                if (c !== card) c.classList.remove('is-flipped');
            });
            card.classList.toggle('is-flipped');
        });
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.flip-card')) {
            flipCards.forEach((c) => c.classList.remove('is-flipped'));
        }
    });
}

/**
 * Sets up the Contact Form via the shared Firestore form handler.
 */
function setupContactForm() {
    const form = document.getElementById('contact-form');
    const formContainer = document.getElementById('contact-form-container');
    const successContainer = document.getElementById('contact-success');
    const resetBtn = document.getElementById('contact-reset-btn');
    const submitBtn = document.getElementById('contact-submit-btn');

    if (!form || !submitBtn) return;

    const nameInput = document.getElementById('contact-name');
    const emailInput = document.getElementById('contact-email');
    const messageInput = document.getElementById('contact-message');

    // Helper to transition from form view to success state
    function showSuccessState() {
        formContainer.style.opacity = '0';
        setTimeout(() => {
            formContainer.classList.add('hidden');
            successContainer.classList.remove('hidden');
        }, 500);
    }

    const formController = attachFirestoreForm({
        form,
        collectionName: 'messages',
        honeypotSelector: '#contact_hp',
        submitBtn,
        btnTextDefault: document.getElementById('btn-text-default'),
        btnTextLoading: document.getElementById('btn-text-loading'),
        spinner: document.getElementById('contact-spinner'),
        errorContainer: document.getElementById('contact-error-msg'),
        buildPayload: () => {
            const name = nameInput?.value.trim() || '';
            const email = emailInput?.value.trim() || '';
            const message = messageInput?.value.trim() || '';

            if (!isValidEmail(email)) {
                return { valid: false, focusEl: emailInput };
            }

            // Guard against whitespace-only submissions that bypass HTML `required`
            if (!message) {
                return { valid: false, focusEl: messageInput };
            }

            return {
                valid: true,
                data: {
                    name: name || 'Anonymous',
                    email,
                    message,
                    source: 'homepage_contact'
                }
            };
        },
        onSuccess: ({ isBot }) => {
            if (!isBot && typeof window.gtag === 'function') {
                window.gtag('event', 'contact_form_submit', {
                    event_category: 'engagement',
                    event_label: 'Homepage Contact Form'
                });
            }

            showSuccessState();
        }
    });

    // Reset logic ("Send another message")
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            form.reset();
            formController?.clearError();
            successContainer.classList.add('hidden');

            formContainer.classList.remove('hidden');
            // Wait one frame so display:block applies before opacity transition
            requestAnimationFrame(() => {
                formContainer.style.opacity = '1';
            });
        });
    }
}

/**
 * Analytics tracking for global CTA clicks.
 */
function setupAnalytics() {
    document.addEventListener('click', (e) => {
        const launchTarget = e.target.closest('[data-analytics="launch-app"]');
        if (launchTarget && typeof window.gtag === 'function') {
            window.gtag('event', 'launch_app_click', {
                event_category: 'engagement',
                event_label: 'Global Launch Button'
            });
        }

        const waitlistTarget = e.target.closest('[data-analytics="waitlist-click"]');
        if (waitlistTarget && typeof window.gtag === 'function') {
            window.gtag('event', 'join_waitlist_redirect', {
                event_category: 'engagement',
                event_label: 'Pricing Section Redirect'
            });
        }
    });
}

/**
 * Loads the external Hero SVG inline, waits for the typewriter phrase to finish,
 * plays the multi-stage animation, and prevents replay interruption until complete.
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

        // Remove fixed dimensions so CSS controls responsive scaling cleanly
        svgElement.removeAttribute('width');
        svgElement.removeAttribute('height');

        const {
            DELAY_AFTER_TYPING_MS,
            PUZZLE_START_DELAY_S,
            PUZZLE_STEP_S,
            PUZZLE_DURATION_S,
            PAUSE_BETWEEN_STAGES_S,
            WORD_STEP_S,
            WORD_DURATION_S
        } = HERO_ANIMATION_CONFIG;

        // 1. Assign staggered delays to puzzles (mouth -> phone)
        const puzzles = svgElement.querySelectorAll('#puzzles > g');
        puzzles.forEach((puzzle, index) => {
            const delay = PUZZLE_START_DELAY_S + index * PUZZLE_STEP_S;
            puzzle.style.setProperty('--delay', `${delay.toFixed(2)}s`);
        });

        // 2. Calculate pause after last puzzle lands, then stagger words
        const lastPuzzleEnd = puzzles.length > 0
            ? PUZZLE_START_DELAY_S + (puzzles.length - 1) * PUZZLE_STEP_S + PUZZLE_DURATION_S
            : 0;
        const wordsStartDelay = lastPuzzleEnd + PAUSE_BETWEEN_STAGES_S;

        const words = svgElement.querySelectorAll('#words > g');
        words.forEach((word, index) => {
            const delay = wordsStartDelay + index * WORD_STEP_S;
            word.style.setProperty('--delay', `${delay.toFixed(2)}s`);
        });

        // 3. Total duration of the entire SVG sequence (in ms) for lock protection
        const totalSequenceSeconds = words.length > 0
            ? wordsStartDelay + (words.length - 1) * WORD_STEP_S + WORD_DURATION_S
            : lastPuzzleEnd;
        const totalSequenceMs = Math.ceil(totalSequenceSeconds * 1000) + 50;

        stage.innerHTML = '';
        stage.appendChild(svgElement);

        let isSvgAnimating = false;
        let unlockTimeout = null;

        const playAnimation = () => {
            // Do not interrupt if the animation is currently in progress
            if (isSvgAnimating) return;

            isSvgAnimating = true;
            stage.classList.remove('is-playing');
            // Force browser reflow to cleanly restart CSS keyframe animations
            void stage.offsetWidth;
            stage.classList.add('is-playing');

            if (unlockTimeout) clearTimeout(unlockTimeout);
            unlockTimeout = setTimeout(() => {
                isSvgAnimating = false;
                unlockTimeout = null;
            }, totalSequenceMs);
        };

        const scheduleStartAfterTyping = () => {
            setTimeout(playAnimation, DELAY_AFTER_TYPING_MS);
        };

        // Start after typewriter finishes (handles both normal order and slow SVG fetch)
        if (isTypewriterFinished) {
            scheduleStartAfterTyping();
        } else {
            document.addEventListener('hero:typewriter-done', scheduleStartAfterTyping, { once: true });
        }

        // Replay on mouse enter (desktop) and tap/click (mobile & desktop) when idle
        stage.addEventListener('mouseenter', playAnimation);
        stage.addEventListener('click', playAnimation);
    } catch {
        // Fail silently if SVG cannot be fetched
    }
}

/**
 * Main page initialization.
 */
function initPage() {
    const heroTitle = document.getElementById('hero-title-display');
    if (heroTitle) heroTitle.innerHTML = '\u00A0';

    setupScrollReveal();
    setupTiltEffect();
    setupFlipCards();
    setupContactForm();
    setupAnalytics();
    initHeroSvgAnimation();

    setTimeout(() => triggerHeroAnimation(), HERO_ANIMATION_CONFIG.INITIAL_TYPING_DELAY_MS);
}

// Event-driven init
if (window.hearmeReady) {
    initPage();
} else {
    document.addEventListener('hearme:ready', initPage);
}

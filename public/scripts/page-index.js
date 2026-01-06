// public/scripts/page-index.js

// This is the entry point for the index (home) page.

import { loadCommonElements } from './common.js';

// Configuration constant for typewriter speed (in milliseconds)
// 150ms is slower/more accessible (approx. ~400 chars/minute reading speed)
const HERO_TYPING_SPEED = 150;

// Variable to track the active typewriter timer ID.
let activeTypewriterTimeout = null;

/**
 * Initializes the Scroll Reveal animation using IntersectionObserver.
 */
function setupScrollReveal() {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.7
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
 * Simulates a typewriter effect while preserving HTML tags.
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

/**
 * Synchronizes the visible hero title with the hidden source element.
 */
function triggerHeroAnimation() {
    const displayElement = document.getElementById('hero-title-display');
    const sourceElement = document.getElementById('hero-title-source');

    if (displayElement && sourceElement) {
        const textToType = sourceElement.innerHTML;
        typeWriterEffect(displayElement, textToType, HERO_TYPING_SPEED);
    }
}

/**
 * Main initialization function.
 */
async function main() {
    const heroTitle = document.getElementById('hero-title-display');
    if (heroTitle) {
        heroTitle.innerHTML = '&nbsp;';
    }

    await loadCommonElements();
    
    setupScrollReveal();

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

        setTimeout(() => {
            triggerHeroAnimation();
        }, 100); 
    });
    
    console.log("Index page initialized.");
}

document.addEventListener('DOMContentLoaded', main);

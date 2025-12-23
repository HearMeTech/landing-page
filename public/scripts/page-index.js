// This is the entry point for the Index (Home) page.

import { loadCommonElements } from './common.js';

/**
 * Initializes the Scroll Reveal animation using IntersectionObserver.
 * Elements with class '.reveal' will animate when they enter the viewport.
 */
function setupScrollReveal() {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.7 // Trigger when 70% of the element is visible
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
 * * @param {HTMLElement} element - The visible element to type into.
 * @param {string} text - The HTML content to type.
 * @param {number} speed - Typing speed in ms (default: 30ms).
 */
function typeWriterEffect(element, text, speed = 30) {
    if (!element || !text) return;

    // Clear content but maintain height using a non-breaking space
    element.innerHTML = '&nbsp;';
    
    let i = 0;
    let isTag = false;
    let currentHTML = '';

    function type() {
        if (i >= text.length) return;

        const char = text.charAt(i);

        // Detect HTML tag start
        if (char === '<') isTag = true;
        
        currentHTML += char;
        element.innerHTML = currentHTML; 
        
        // Detect HTML tag end
        if (char === '>') isTag = false;

        i++;

        // Recursive call: Instant for HTML tags, delayed for regular text
        if (isTag) {
            type();
        } else {
            setTimeout(type, speed);
        }
    }

    type();
}

/**
 * Synchronizes the visible hero title with the hidden source element.
 * This ensures the typewriter effect uses the latest translated text.
 */
function triggerHeroAnimation() {
    const displayElement = document.getElementById('hero-title-display');
    const sourceElement = document.getElementById('hero-title-source');

    if (displayElement && sourceElement) {
        // Retrieve the updated text from the hidden "ghost" element
        const textToType = sourceElement.innerHTML;
        typeWriterEffect(displayElement, textToType, 160);
    }
}

/**
 * Main initialization function.
 */
async function main() {
    await loadCommonElements();
    setupScrollReveal();

    // 1. Initial run: Trigger animation on page load
    setTimeout(() => triggerHeroAnimation(), 500);

    // 2. Event Listener: Handle language changes dynamically
    window.addEventListener('language-changed', () => {
        const displayElement = document.getElementById('hero-title-display');
        
        // Instantly clear the visible text (show placeholder) while i18n updates the source
        if (displayElement) displayElement.innerHTML = '&nbsp;';

        // Brief delay to allow i18n to update the source element before typing starts
        setTimeout(() => {
            triggerHeroAnimation();
        }, 100); 
    });
    
    console.log("Index page initialized.");
}

document.addEventListener('DOMContentLoaded', main);

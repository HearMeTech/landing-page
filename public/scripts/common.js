// public/scripts/common.js

// This file contains common logic shared across pages,
// such as loading the header/footer, navigation state, and global UI elements.

import { initI18n } from './i18n.js';

/**
 * Loads header.html and footer.html into their respective placeholders.
 * Dispatches 'hearme:ready' event when finished.
 */
async function loadCommonElements() {
    const headerPlaceholder = document.getElementById('header-placeholder');
    const footerPlaceholder = document.getElementById('footer-placeholder');

    // Add timestamp to prevent caching of HTML partials
    const version = Date.now();

    // Parallel fetch for better performance
    const [headerResponse, footerResponse] = await Promise.all([
        fetch(`/components/header.html?v=${version}`),
        fetch(`/components/footer.html?v=${version}`)
    ]);

    if (headerPlaceholder && headerResponse && headerResponse.ok) {
        headerPlaceholder.outerHTML = await headerResponse.text();
        setupMobileMenu(); 
        setupActiveNavigation(); 
    }

    if (footerPlaceholder && footerResponse && footerResponse.ok) {
        footerPlaceholder.innerHTML = await footerResponse.text();
        // Update year immediately after footer is injected
        updateCopyrightYear();
    }
    
    await initI18n(); 

    setupScrollToTop();

    // Notify other scripts that common elements are loaded
    window.hearmeReady = true;
    document.dispatchEvent(new CustomEvent('hearme:ready'));
}

/**
 * Updates the copyright year in the footer dynamically.
 * Handles ranges (e.g., "2025–2026") automatically.
 */
function updateCopyrightYear() {
    const yearElement = document.getElementById('copyright-year');
    
    if (yearElement) {
        const startYear = 2025;
        const currentYear = new Date().getFullYear();
        
        // If current year is > 2025, show "2025–2026", else just "2025"
        yearElement.textContent = currentYear > startYear 
            ? `${startYear}–${currentYear}` 
            : startYear.toString();
    }
}

/**
 * Sets up the mobile menu toggle functionality.
 */
function setupMobileMenu() {
    const menuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');

    if (menuButton && mobileMenu) {
        menuButton.addEventListener('click', () => {
            const isHidden = mobileMenu.classList.contains('hidden');
            if (isHidden) {
                mobileMenu.classList.remove('hidden');
            } else {
                mobileMenu.classList.add('hidden');
            }
        });

        // Close menu when a link inside it is clicked
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.add('hidden');
            });
        });
    }
}

/**
 * Sets up the "Scroll to Top" button.
 * Creates the element dynamically and handles visibility logic.
 */
function setupScrollToTop() {
    // 1. Create the button element dynamically
    const scrollBtn = document.createElement('button');
    scrollBtn.id = 'scroll-to-top';
    scrollBtn.setAttribute('aria-label', 'Scroll to top');
    scrollBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
    `;
    document.body.appendChild(scrollBtn);

    let isReturningToTop = false;

    // 2. Click handler: Smooth scroll to top & Hide immediately
    scrollBtn.addEventListener('click', () => {
        isReturningToTop = true;
        scrollBtn.classList.remove('visible');
        
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // 3. Scroll handler
    let isScrolling = false;
    window.addEventListener('scroll', () => {
        if (!isScrolling) {
            window.requestAnimationFrame(() => {
                const scrollY = window.scrollY;

                if (scrollY <= 300) {
                    isReturningToTop = false;
                }

                if (scrollY > 300 && !isReturningToTop) {
                    scrollBtn.classList.add('visible');
                } else {
                    scrollBtn.classList.remove('visible');
                }
                isScrolling = false;
            });
            isScrolling = true;
        }
    });
}

/**
 * Sets up "Scroll Spy" functionality to highlight active menu items.
 * Uses IntersectionObserver for high performance.
 */
function setupActiveNavigation() {
    // Only run this if we are on the main page where sections exist
    const sections = document.querySelectorAll('section[id]');
    if (sections.length === 0) return;

    const navLinks = document.querySelectorAll('nav a[href^="/#"], #mobile-menu a[href^="/#"]');

    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.30 // Section is considered "active" when 30% visible
    };

    const observerCallback = (entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Remove active class from all links
                navLinks.forEach(link => link.classList.remove('nav-link-active'));
                
                // Add active class to corresponding link
                const id = entry.target.getAttribute('id');
                // Select links that point to this ID (handling /#id)
                const activeLinks = document.querySelectorAll(`nav a[href*="#${id}"]`);
                activeLinks.forEach(link => link.classList.add('nav-link-active'));
            }
        });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    sections.forEach(section => observer.observe(section));
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadCommonElements);
} else {
    loadCommonElements();
}

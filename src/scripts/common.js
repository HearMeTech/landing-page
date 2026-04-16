// public/js/common.js

// Dynamically create a regex to match language prefixes in URLs (e.g., /uk/, /de/, etc.)
const altLangs = Object.keys(window.APP_CONFIG.supportedLangs).filter(lang => lang !== window.APP_CONFIG.defaultLang);
window.APP_CONFIG.langPrefixRegex = new RegExp(`^\\/(${altLangs.join('|')})(\\/|$)`);

/**
 * Auto Language Router (Runs immediately)
 * Detects browser language or saved preference and redirects if necessary.
 */
(function autoRouteLanguage() {
    const currentPath = window.location.pathname;
    const currentLang = document.documentElement.lang || window.APP_CONFIG.defaultLang;

    if (currentLang !== window.APP_CONFIG.defaultLang) {
        localStorage.setItem('app_lang', currentLang);
        return;
    }

    let targetLang = localStorage.getItem('app_lang');

    if (!targetLang) {
        const browserLang = (navigator.language || navigator.userLanguage || '').split('-')[0].toLowerCase();
        targetLang = Object.keys(window.APP_CONFIG.supportedLangs).includes(browserLang) ? browserLang : window.APP_CONFIG.defaultLang;
        localStorage.setItem('app_lang', targetLang);
    }

    if (targetLang && targetLang !== window.APP_CONFIG.defaultLang) {
        let cleanPath = currentPath.replace(/\/index\.html$/, '/');
        if (!cleanPath.startsWith('/')) cleanPath = '/' + cleanPath;
        
        let newPath = `/${targetLang}${cleanPath}`;
        newPath = newPath.replace(/\/+/g, '/');
        newPath += window.location.search + window.location.hash;

        window.location.replace(newPath);
    }
})();

/**
 * Updates the copyright year in the footer dynamically (Modern single-year format).
 */
function updateCopyrightYear() {
    const yearElement = document.getElementById('copyright-year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear().toString();
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
            mobileMenu.classList.toggle('hidden');
        });

        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.add('hidden');
            });
        });

        window.addEventListener('scroll', () => {
            if (!mobileMenu.classList.contains('hidden')) {
                mobileMenu.classList.add('hidden');
            }
        }, { passive: true });
    }
}

/**
 * Language Switcher Logic (SSG Version)
 * Redirects user to the correct physical URL based on selected language.
 */
function setupLanguageSwitchers() {
    const currentLang = document.documentElement.lang || window.APP_CONFIG.defaultLang;
    const switchers = document.querySelectorAll('#language-switcher, #language-switcher-mobile');

    if (!switchers || switchers.length === 0) return;
    
    switchers.forEach(switcher => {
        switcher.value = currentLang;
        
        switcher.addEventListener('change', (e) => {
            const newLang = e.target.value;
            if (newLang === currentLang) return;
            
            localStorage.setItem('app_lang', newLang);
            sessionStorage.setItem('lang_switch_scroll_pos', window.scrollY);
            
            let path = window.location.pathname;
            path = path.replace(/\/index\.html$/, '/');
            
            let cleanPath = path.replace(window.APP_CONFIG.langPrefixRegex, '/');
            
            if (!cleanPath.startsWith('/')) cleanPath = '/' + cleanPath;
            
            let newPath = newLang === window.APP_CONFIG.defaultLang ? cleanPath : `/${newLang}${cleanPath}`;
            
            newPath = newPath.replace(/\/+/g, '/');
            newPath += window.location.search + window.location.hash;
            
            window.location.href = newPath;
        });
    });
}

/**
 * Sets up the "Scroll to Top" button.
 */
function setupScrollToTop() {
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

    scrollBtn.addEventListener('click', () => {
        isReturningToTop = true;
        scrollBtn.classList.remove('visible');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    let isScrolling = false;
    window.addEventListener('scroll', () => {
        if (!isScrolling) {
            window.requestAnimationFrame(() => {
                const scrollY = window.scrollY;
                if (scrollY <= 300) isReturningToTop = false;

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
 */
function setupActiveNavigation() {
    const sections = document.querySelectorAll('section[id]');
    if (sections.length === 0) return;

    const navLinks = document.querySelectorAll('nav a[href*="#"], #mobile-menu a[href*="#"]');

    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.30
    };

    const observerCallback = (entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                navLinks.forEach(link => link.classList.remove('nav-link-active'));
                
                const id = entry.target.getAttribute('id');
                const activeLinks = document.querySelectorAll(`nav a[href*="#${id}"], #mobile-menu a[href*="#${id}"]`);
                activeLinks.forEach(link => {
                    if (!link.classList.contains('bg-brand-teal')) {
                        link.classList.add('nav-link-active');
                    }
                });
            }
        });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    sections.forEach(section => observer.observe(section));
}

/**
 * Sets up the Smart Header (hides on scroll down, shows on scroll up)
 */
function setupSmartHeader() {
    const header = document.querySelector('header');
    const footerContent = document.querySelector('footer .grid');
    
    if (!header) return;

    let lastScrollY = window.scrollY;
    let isFooterVisible = false;
    let ticking = false;

    if (footerContent) {
        const observer = new IntersectionObserver((entries) => {
            isFooterVisible = entries[0].isIntersecting;
            
            if (isFooterVisible && window.scrollY > 10) {
                header.classList.add('-translate-y-full');
            } else if (!isFooterVisible || window.scrollY <= 10) {
                header.classList.remove('-translate-y-full');
            }
        }, { threshold: 0 });
        observer.observe(footerContent);
    }

    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                const currentScrollY = window.scrollY;

                if (currentScrollY <= 0) {
                    header.classList.remove('-translate-y-full');
                } 
                else if (currentScrollY > lastScrollY) {
                    if (currentScrollY > 80 || isFooterVisible) {
                        header.classList.add('-translate-y-full');
                    }
                } 
                else if (currentScrollY < lastScrollY) {
                    if (!isFooterVisible) {
                        header.classList.remove('-translate-y-full');
                    }
                }
                
                lastScrollY = currentScrollY;
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });
}

/**
 * Main Initialization
 */
function initCommonElements() {
    const savedScroll = sessionStorage.getItem('lang_switch_scroll_pos');
    if (savedScroll !== null) {
        setTimeout(() => {
            window.scrollTo(0, parseInt(savedScroll, 10));
        }, 0);
        sessionStorage.removeItem('lang_switch_scroll_pos');
    }

    updateCopyrightYear();
    setupMobileMenu();
    setupLanguageSwitchers();
    setupActiveNavigation();
    setupScrollToTop();
    setupSmartHeader();

    window.hearmeReady = true;
    document.dispatchEvent(new CustomEvent('hearme:ready'));
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCommonElements);
} else {
    initCommonElements();
}

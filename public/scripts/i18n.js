// public/scripts/i18n.js

/**
 * Simple Client-Side Localization Script
 */

const SUPPORTED_LANGUAGES = {
    en: "English",
    uk: "Українська",
    de: "Deutsch",
    es: "Español",
    fr: "Français",
    pt: "Português"
};

const DEFAULT_LANG = 'en';

let currentLang = DEFAULT_LANG;
let translations = {};

/**
 * Initialize localization
 */
export async function initI18n() {
    // Safety timeout: If something goes wrong, force show content after 700ms
    const safetyTimer = setTimeout(() => {
        document.body.classList.add('loaded');
    }, 700);

    try {
        const urlParams = new URLSearchParams(window.location.search);
        const langParam = urlParams.get('lang');
        const storedLang = localStorage.getItem('app_lang');
        const browserLang = navigator.language.slice(0, 2);

        if (langParam && SUPPORTED_LANGUAGES[langParam]) {
            currentLang = langParam;
        } else if (storedLang && SUPPORTED_LANGUAGES[storedLang]) {
            currentLang = storedLang;
        } else if (SUPPORTED_LANGUAGES[browserLang]) {
            currentLang = browserLang;
        }

        // Load translations
        await loadTranslations(currentLang);

        // Apply translations to the page
        applyTranslations();

        // Update switcher UI
        syncSwitchersUI();

        // Setup event listeners
        setupLanguageSwitchers();

        // Save preference
        localStorage.setItem('app_lang', currentLang);
        document.documentElement.lang = currentLang;

    } catch (error) {
        console.error("Critical i18n error:", error);
    } finally {
        // Clear safety timer
        clearTimeout(safetyTimer);
        // ALWAYS show the site, even if i18n failed
        requestAnimationFrame(() => {
            document.body.classList.add('loaded');
        });
    }
}

/**
 * Change language dynamically without reloading the page (SPA feel)
 */
async function changeLanguage(newLang) {
    if (newLang === currentLang) return;

    // Fade OUT
    document.body.classList.remove('loaded');

    // Close Mobile Menu if open
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
        mobileMenu.classList.add('hidden');
    }

    // Wait for fade-out
    await new Promise(resolve => setTimeout(resolve, 250));

    currentLang = newLang;
    
    // Load new JSON
    await loadTranslations(newLang);
    
    // Apply new texts
    applyTranslations();
    
    // Update local storage & HTML tag
    localStorage.setItem('app_lang', currentLang);
    document.documentElement.lang = currentLang;

    // Sync all dropdowns
    syncSwitchersUI();

    // Fade IN
    document.body.classList.add('loaded');
}

/**
 * Load JSON translation file
 */
async function loadTranslations(lang) {
    try {
        const response = await fetch(`/locales/${lang}.json?v=${Date.now()}`);
        if (!response.ok) throw new Error(`Status ${response.status}`);
        translations = await response.json();
    } catch (error) {
        console.error(`Could not load translations for ${lang}`, error);
        // Try fallback to English if not already English
        if (lang !== 'en') {
            console.log("Falling back to English...");
            await loadTranslations('en');
        }
    }
}

/**
 * Replace text content in HTML elements with data-i18n attribute
 */
export function applyTranslations() {
    const elements = document.querySelectorAll('[data-i18n]');
    
    elements.forEach(element => {
        const key = element.getAttribute('data-i18n');
        const text = key.split('.').reduce((obj, i) => obj ? obj[i] : null, translations);
        
        if (text) {
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.placeholder = text;
            } else if (element.tagName === 'TITLE') {
                document.title = text;
            } else if (element.tagName === 'META') {
                element.setAttribute('content', text);
            } else {
                element.innerHTML = text; 
            }
        }
    });
}

/**
 * Attach event listeners to all language selects
 */
function setupLanguageSwitchers() {
    const switchers = document.querySelectorAll('#language-switcher, #language-switcher-mobile');
    
    switchers.forEach(switcher => {
        // Clone to remove old listeners if any, then re-attach
        const newSwitcher = switcher.cloneNode(true);
        switcher.parentNode.replaceChild(newSwitcher, switcher);

        newSwitcher.addEventListener('change', (e) => {
            const newLang = e.target.value;
            changeLanguage(newLang);
        });
        
        // Ensure value is correct after cloning
        newSwitcher.value = currentLang;
    });
}

/**
 * Ensure all selects (mobile/desktop) show the current language
 */
function syncSwitchersUI() {
    const switchers = document.querySelectorAll('#language-switcher, #language-switcher-mobile');
    switchers.forEach(switcher => {
        switcher.value = currentLang;
    });
}

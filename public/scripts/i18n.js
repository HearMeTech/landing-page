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
    // 1. Determine language (URL > LocalStorage > Browser > Default)
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

    // 2. Load translations
    await loadTranslations(currentLang);

    // 3. Apply translations to the page
    applyTranslations();

    // 4. Update switcher UI (sync select boxes)
    syncSwitchersUI();

    // 5. Setup event listeners for switchers
    setupLanguageSwitchers();

    // 6. Save preference and HTML lang attribute
    localStorage.setItem('app_lang', currentLang);
    document.documentElement.lang = currentLang;

    // FIX 1: Fade IN the page after content is ready
    // Small delay to ensure DOM is updated
    requestAnimationFrame(() => {
        document.body.classList.add('loaded');
    });
}

/**
 * Change language dynamically without reloading the page (SPA feel)
 */
async function changeLanguage(newLang) {
    if (newLang === currentLang) return;

    // FIX 1: Start Fade OUT
    document.body.classList.remove('loaded');

    // Wait for fade-out transition (matches CSS duration)
    await new Promise(resolve => setTimeout(resolve, 250));

    currentLang = newLang;
    
    // Load new JSON
    await loadTranslations(newLang);
    
    // Apply new texts
    applyTranslations();
    
    // Update local storage & HTML tag
    localStorage.setItem('app_lang', currentLang);
    document.documentElement.lang = currentLang;

    // Update URL without reload (optional, purely visual)
    const url = new URL(window.location);
    url.searchParams.set('lang', currentLang);
    window.history.pushState({}, '', url);

    // Sync all dropdowns
    syncSwitchersUI();

    // FIX 1: Fade IN
    document.body.classList.add('loaded');
}

/**
 * Load JSON translation file
 */
async function loadTranslations(lang) {
    try {
        // Adding timestamp to bypass cache
        const response = await fetch(`/locales/${lang}.json?v=${Date.now()}`);
        if (!response.ok) throw new Error(`Status ${response.status}`);
        translations = await response.json();
    } catch (error) {
        console.error(`Could not load translations for ${lang}`, error);
        if (lang !== 'en') {
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
        // Resolve nested keys (e.g. "hero.title")
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
        // Remove old listeners by cloning (if needed) or just ensure single binding
        // Here we just attach 'change' event
        switcher.addEventListener('change', (e) => {
            const newLang = e.target.value;
            changeLanguage(newLang);
        });
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

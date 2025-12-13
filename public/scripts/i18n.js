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

    // 4. Update switcher UI (if present)
    updateLanguageSwitcher();
    
    // 5. Save preference
    localStorage.setItem('app_lang', currentLang);
    document.documentElement.lang = currentLang;
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
        // Fallback to English if loading fails and we are not already on English
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
 * Update the <select> element if it exists
 */
function updateLanguageSwitcher() {
    const switchers = document.querySelectorAll('#language-switcher, #language-switcher-mobile');
    
    switchers.forEach(switcher => {
        if (switcher) {
            const newSwitcher = switcher.cloneNode(true);
            
            switcher.parentNode.replaceChild(newSwitcher, switcher);
            
            newSwitcher.value = currentLang;
            
            newSwitcher.addEventListener('change', (e) => {
                const newLang = e.target.value;
                localStorage.setItem('app_lang', newLang);
                window.location.reload(); 
            });
        }
    });
}

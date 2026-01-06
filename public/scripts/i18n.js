// public/scripts/i18n.js

// Internationalization (i18n) module for handling multiple languages.

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

export async function initI18n() {
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

        await loadTranslations(currentLang);
        applyTranslations();
        syncSwitchersUI();
        setupLanguageSwitchers();

        localStorage.setItem('app_lang', currentLang);
        document.documentElement.lang = currentLang;

    } catch (error) {
        console.error("i18n init error:", error);
    } finally {
        document.body.classList.remove('language-loading');
        document.documentElement.classList.remove('initial-loading');
    }
}

async function changeLanguage(newLang) {
    if (newLang === currentLang) return;

    // 1. Force close mobile menu immediately (Critical for iOS Chrome)
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenu) {
        mobileMenu.classList.add('hidden');
    }

    // 2. Remove focus from the select element to close the native iOS picker
    if (document.activeElement && document.activeElement.tagName === 'SELECT') {
        document.activeElement.blur();
    }

    // 3. Start Fade Out sequence
    document.body.classList.add('language-loading');

    // 4. "Double RAF" Hack:
    // This forces the browser to paint the 'opacity: 0' state frame 
    // BEFORE executing any heavy logic (fetching/parsing).
    // This solves the "missing fade effect" on mobile Chrome.
    await new Promise(resolve => {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                resolve();
            });
        });
    });

    // Wait slightly longer to ensure the CSS transition (250ms) has visually completed
    await new Promise(resolve => setTimeout(resolve, 300));

    // 5. Perform the data swap (while invisible)
    currentLang = newLang;
    
    await loadTranslations(newLang);
    applyTranslations();
    
    localStorage.setItem('app_lang', currentLang);
    document.documentElement.lang = currentLang;

    syncSwitchersUI();

    window.dispatchEvent(new CustomEvent('language-changed'));

    // 6. Start Fade In sequence
    // Another RAF to ensure DOM updates are ready before revealing
    requestAnimationFrame(() => {
        document.body.classList.remove('language-loading');
    });
}

async function loadTranslations(lang) {
    try {
        // Adding timestamp to bypass caching
        const response = await fetch(`/locales/${lang}.json?v=${Date.now()}`);
        if (!response.ok) throw new Error(`Status ${response.status}`);
        translations = await response.json();
    } catch (error) {
        console.error(`Could not load translations for ${lang}`, error);
        // Fallback to English only if we aren't already on English
        if (lang !== 'en') {
            await loadTranslations('en');
        }
    }
}

export function applyTranslations() {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(element => {
        const key = element.getAttribute('data-i18n');
        // Safely access nested keys
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

function setupLanguageSwitchers() {
    const switchers = document.querySelectorAll('#language-switcher, #language-switcher-mobile');
    switchers.forEach(switcher => {
        // Clone node to strip existing event listeners (prevents duplicate bindings)
        const newSwitcher = switcher.cloneNode(true);
        switcher.parentNode.replaceChild(newSwitcher, switcher);

        newSwitcher.addEventListener('change', (e) => {
            const newLang = e.target.value;
            changeLanguage(newLang);
        });
        
        // Ensure value is synced
        newSwitcher.value = currentLang;
    });
}

function syncSwitchersUI() {
    const switchers = document.querySelectorAll('#language-switcher, #language-switcher-mobile');
    switchers.forEach(switcher => {
        switcher.value = currentLang;
    });
}

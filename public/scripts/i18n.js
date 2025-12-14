// public/scripts/i18n.js

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
    }
}

async function changeLanguage(newLang) {
    if (newLang === currentLang) return;

    if (document.activeElement && document.activeElement.tagName === 'SELECT') {
        document.activeElement.blur();
    }

    document.body.classList.add('language-loading');

    void document.body.offsetWidth; 

    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenu) {
        mobileMenu.classList.add('hidden');
    }

    await new Promise(resolve => setTimeout(resolve, 250));

    currentLang = newLang;
    await loadTranslations(newLang);
    applyTranslations();
    
    localStorage.setItem('app_lang', currentLang);
    document.documentElement.lang = currentLang;

    syncSwitchersUI();

    document.body.classList.remove('language-loading');
}

async function loadTranslations(lang) {
    try {
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

function setupLanguageSwitchers() {
    const switchers = document.querySelectorAll('#language-switcher, #language-switcher-mobile');
    switchers.forEach(switcher => {
        const newSwitcher = switcher.cloneNode(true);
        switcher.parentNode.replaceChild(newSwitcher, switcher);

        newSwitcher.addEventListener('change', (e) => {
            const newLang = e.target.value;
            changeLanguage(newLang);
        });
        newSwitcher.value = currentLang;
    });
}

function syncSwitchersUI() {
    const switchers = document.querySelectorAll('#language-switcher, #language-switcher-mobile');
    switchers.forEach(switcher => {
        switcher.value = currentLang;
    });
}

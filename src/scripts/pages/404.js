// src/scripts/pages/404.js

document.addEventListener('DOMContentLoaded', () => {
    updateHomeButtonLink();
    startRedirectTimer();
});

/**
 * Updates the homepage button link to match the active page language.
 */
function updateHomeButtonLink() {
    const currentLang = document.documentElement.lang || 'en';
    const homeButton = document.querySelector('a[data-i18n="error404.btn_home"]');

    if (homeButton) {
        homeButton.setAttribute('href', `/${currentLang}/`);
    }
}

/**
 * Counts down from 10 seconds and redirects to the current language homepage.
 */
function startRedirectTimer() {
    const countdownElement = document.getElementById('redirect-countdown');
    let secondsLeft = 10;

    const timerInterval = setInterval(() => {
        secondsLeft--;

        if (countdownElement) {
            countdownElement.textContent = String(secondsLeft);
        }

        if (secondsLeft <= 0) {
            clearInterval(timerInterval);

            const currentLang = document.documentElement.lang || 'en';
            window.location.replace(`/${currentLang}/`);
        }
    }, 1000);
}

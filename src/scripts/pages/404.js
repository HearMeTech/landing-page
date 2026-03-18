// public/js/pages/404.js

document.addEventListener('DOMContentLoaded', () => {
    const storedLang = localStorage.getItem('app_lang');
    const currentPath = window.location.pathname;

    const isLocalizedPath = /^\/(uk|de|es|fr|pt)\//.test(currentPath);

    if (storedLang && storedLang !== 'en' && !isLocalizedPath) {
        window.location.href = `/${storedLang}/404`;
        return;
    }

    startRedirectTimer();
});

function startRedirectTimer() {
    const countdownElement = document.getElementById('redirect-countdown');
    let secondsLeft = 10;

    const timerInterval = setInterval(() => {
        secondsLeft--;

        if (countdownElement) {
            countdownElement.textContent = secondsLeft;
        }

        if (secondsLeft <= 0) {
            clearInterval(timerInterval);
            
            const currentLang = document.documentElement.lang || 'en';
            
            window.location.href = currentLang === 'en' ? '/' : `/${currentLang}/`;
        }
    }, 1000);
}

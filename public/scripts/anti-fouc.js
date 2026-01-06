// public/scripts/anti-fouc.js

(function() {
    try {
        var lang = localStorage.getItem('app_lang');
        if (lang && lang !== 'en') {
            document.documentElement.className += ' initial-loading';
            setTimeout(function() {
                document.documentElement.classList.remove('initial-loading');
            }, 1500);
        }
    } catch {
        // Ignore errors to ensure the page always renders
    }
})();

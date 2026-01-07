/**
 * public/scripts/page-404.js
 * Handles the 10-second countdown and automatic redirection to the homepage.
 */

document.addEventListener('DOMContentLoaded', () => {
    startRedirectTimer();
});

function startRedirectTimer() {
    const countdownElement = document.getElementById('redirect-countdown');
    let secondsLeft = 10;

    const timerInterval = setInterval(() => {
        secondsLeft--;

        // Update the visual counter if the element exists
        if (countdownElement) {
            countdownElement.textContent = secondsLeft;
        }

        // Redirect when time is up
        if (secondsLeft <= 0) {
            clearInterval(timerInterval);
            window.location.href = '/';
        }
    }, 1000);
}

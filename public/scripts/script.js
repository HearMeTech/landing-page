// === Loading components logic (Header/Footer) ===
async function loadCommonElements() {
    const headerPlaceholder = document.getElementById('header-placeholder');
    const footerPlaceholder = document.getElementById('footer-placeholder');

    const [headerResponse, footerResponse] = await Promise.all([
        headerPlaceholder ? fetch('/components/header.html') : Promise.resolve(null),
        footerPlaceholder ? fetch('/components/footer.html') : Promise.resolve(null)
    ]);

    if (headerPlaceholder && headerResponse && headerResponse.ok) {
        headerPlaceholder.outerHTML = await headerResponse.text();
        setupMobileMenu();
    }

    if (footerPlaceholder && footerResponse && footerResponse.ok) {
        footerPlaceholder.innerHTML = await footerResponse.text();
    }
}

// === Landing logic (index.html, coming-soon.html) ===
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
    }
}

// === Maintenance page logic (maintenance.html) ===

// Timer update
function setupMaintenanceTimer() {
    // Set the exact end date and time for the maintenance.
    // FORMAT: "Year-Month-DayTHour:Minute:Second"
    // 
    // IMPORTANT: Specify your time zone (e.g., +03:00 for Kyiv/EEST).
    // 
    // Example: October 27, 2025, 18:00:00 Kyiv time will be "2025-10-27T18:00:00+03:00"
    const MAINTENANCE_END_TIME = "2025-12-31T18:00:00+03:00";
    
    const timerElement = document.getElementById('timer');
    
    if (!timerElement) {
        return;
    }

    const endTime = new Date(MAINTENANCE_END_TIME).getTime();

    function pad(num) {
        return num < 10 ? '0' + num : num;
    }

    function updateTimer() {
        const now = new Date().getTime();
        const distance = endTime - now;

        if (distance < 0) {
            clearInterval(interval);
            timerElement.innerHTML = "We should be back now. Please refresh the page!";
            timerElement.classList.add('text-lg', 'font-normal', 'text-gray-700');
            timerElement.classList.remove('text-3xl', 'font-bold', 'text-teal-600');
            return; 
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        timerElement.innerHTML = `
            Returning in:</br>
            <span class="inline-block w-11">${days}</span>d
            <span class="inline-block w-11">${pad(hours)}</span>h
            <span class="inline-block w-11">${pad(minutes)}</span>m
            <span class="inline-block w-11">${pad(seconds)}</span>s
        `;
    }

    const interval = setInterval(updateTimer, 1000);
    updateTimer();
}

// === Init when page is opened ===
document.addEventListener('DOMContentLoaded', async () => {
    await loadCommonElements();
    setupMaintenanceTimer();
});

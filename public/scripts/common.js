// This file contains common logic shared across pages,
// such as loading the header and footer.

/**
 * Loads header.html and footer.html into their respective placeholders.
 */
async function loadCommonElements() {
    const headerPlaceholder = document.getElementById('header-placeholder');
    const footerPlaceholder = document.getElementById('footer-placeholder');

    const [headerResponse, footerResponse] = await Promise.all([
        headerPlaceholder ? fetch('/components/header.html') : Promise.resolve(null),
        footerPlaceholder ? fetch('/components/footer.html') : Promise.resolve(null)
    ]);

    if (headerPlaceholder && headerResponse && headerResponse.ok) {
        headerPlaceholder.outerHTML = await headerResponse.text();
        setupMobileMenu(); // Setup menu logic after header is loaded
    }

    if (footerPlaceholder && footerResponse && footerResponse.ok) {
        footerPlaceholder.innerHTML = await footerResponse.text();
    }
}

/**
 * Sets up the mobile menu toggle functionality.
 * This is called by loadCommonElements after the header is injected.
 */
function setupMobileMenu() {
    const menuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');

    if (menuButton && mobileMenu) {
        menuButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });

        // Close menu when a link inside it is clicked
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.add('hidden');
            });
        });
    }
}

// Export the functions to be used by page-specific scripts
export { loadCommonElements };

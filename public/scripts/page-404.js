// This is the entry point for the 404 page.

import { loadCommonElements } from './common.js';

/**
 * Main initialization function for the 404 page.
 */
async function main() {
    // Load common elements like header/footer
    await loadCommonElements();
    
    console.log("404 page initialized.");
}

// Run the main initialization function when the DOM is ready
document.addEventListener('DOMContentLoaded', main);

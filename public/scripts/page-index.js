// This is the entry point for the Index (Home) page.

import { loadCommonElements } from './common.js';

/**
 * Main initialization function for the Index page.
 */
async function main() {
    // Load common elements like header/footer
    await loadCommonElements();
    
    // Other index-specific logic can go here in the future
    console.log("Index page initialized.");
}

// Run the main initialization function when the DOM is ready
document.addEventListener('DOMContentLoaded', main);

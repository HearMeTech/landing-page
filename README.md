# **HearMe Landing Page**
[![PR Linter & Preview](https://github.com/HearMeTech/landing-page/actions/workflows/firebase-hosting-pull-request.yml/badge.svg)](https://github.com/HearMeTech/landing-page/actions/workflows/firebase-hosting-pull-request.yml)
[![Deploy to Live](https://github.com/HearMeTech/landing-page/actions/workflows/firebase-hosting-merge.yml/badge.svg)](https://github.com/HearMeTech/landing-page/actions/workflows/firebase-hosting-merge.yml)

This is a simple static website that serves as the official landing page for the **HearMe** project.

It is designed to be hosted on the **Firebase Hosting** platform and is built using **Tailwind CSS** (via the play CDN) for a modern, responsive design.

## **🌟 Key Features**

* **Home Page (`index.html`):** The primary page that introduces visitors to our project, vision, features, and roadmap.
* **Waitlist Page (`pages/waitlist.html`):** A dedicated page with a form to capture emails, integrated with Firebase Firestore.
* **Component-Based Structure:** Shared elements (`header.html`, `footer.html`) are loaded from the `/components` directory.
* **Modular JavaScript:** Logic is cleanly split into modules:
  * `firebase-init.js`: Centralized Firebase SDK imports and initialization.
  * `tailwind-config.js`: Centralized Tailwind CSS configuration.
  * `common.js`: Shared logic for loading header/footer and the mobile menu.
  * `page-index.js`: Page-specific logic for `index.html`.
  * `page-waitlist.js`: Page-specific logic for the waitlist form.
  * `page-maintenance.js`: Page-specific logic for the maintenance countdown timer.
  * `page-404.js`: Page-specific logic for the 404 page.
* **Utility Pages:**
  * `pages/maintenance.html`: A temporary page to display during scheduled maintenance.
  * `404.html`: A user-friendly "Not Found" page with full navigation (header/footer).
* **Responsive Design:** The site uses Tailwind CSS for a mobile-first, responsive layout.

## **🛠️ How to Test Locally**

Testing our project involves two key steps:

1. **Running the Quality Linter:** Checking the code for errors and style issues.
2. **Running the Local Server:** Previewing the website visually in your browser.

### Prerequisites

Before you begin, ensure you have:

1. **Node.js and npm:** (This provides the `npm` command).
2. **Firebase CLI:** If you don't have it, install it globally:

```
npm install -g firebase-tools
```

### Step 1: Install Dependencies

After cloning the repository, you must first install the local development tools (linters):
```
npm install
```

### Step 2: Check Code Quality (Linting)

Before any commit, run our complete quality check. This command checks all `HTML`, `CSS`, and `JavaScript` files for errors, ensuring our code stays clean and consistent.
```
npm run lint
```
**If this command shows errors, please fix them before proceeding.**

### Step 3: **Running the Local Server**

1. **Log in to Firebase:** (This step might be optional for `firebase serve`, but it's good practice).
```
    firebase login
```

2. **Run the server:** While in the project's root directory (where `firebase.json` is located), execute the following command:
```
    firebase serve
```

3. **Open the site in your browser:** After running the command, the terminal will show you a local address. By default, it is: `http://localhost:5000`
   * Main page: `http://localhost:5000` (or `http://localhost:5000/index.html`)
   * Waitlist page: `http://localhost:5000/pages/waitlist.html`
   * Maintenance page: `http://localhost:5000/maintenance.html`
   * 404 Page: Navigate to any non-existent URL (e.g., `http://localhost:5000/test`)

## **🚀 Deployment**

For soft reset new version of landing page on all devices run followiing command:
```bash
npm run update-version
```

Deployment is handled automatically.

Any push or pull request merge to the `main` branch will trigger an automatic deployment to Firebase Hosting.

## **📁 File Structure**

* `.github/`: Contains CI/CD workflows and linter configurations.
* `public/`: Contains all static assets, components, and content pages.
  * `components/`: Reusable HTML partials (header, footer).
  * `images/`: Brand logos and other images.
  * `pages/`: Additional content pages (e.g., `waitlist.html`, `maintenance.html`).
  * `scripts/`: Modular JavaScript files.
    * `common.js`: Loads header/footer, menu logic.
    * `firebase-init.js`: Connects to and authenticates with Firebase.
    * `tailwind-config.js`: Shared config for Tailwind CDN.
    * `page-index.js`: Logic for `index.html`.
    * `page-waitlist.js`: Logic for `waitlist.html`.
    * `page-maintenance.js`: Logic for `maintenance.html`.
    * `page-404.js`: Logic for `404.html`.
  * `styles/`: CSS stylesheets (`style.css`).
  * `index.html`: The main landing page (hosting root).
  * `404.html`: Custom 404 error page.
* `firebase.json`: Firebase configuration file.
* `package.json`: Manages npm dependencies (linters) and scripts.
* `eslint.config.js`: Configuration for ESLint.
* `.stylelintrc.json`: Configuration for Stylelint.
* `.gitignore`: Specifies files for Git to ignore.
* `update-version.js`: module for update version of main html files.
* `README.md`: This file.

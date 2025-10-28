# **"Hear Me" Landing Page**
[![PR Linter & Preview](https://github.com/HearMeTech/landing-page/actions/workflows/firebase-hosting-pull-request.yml/badge.svg)](https://github.com/HearMeTech/landing-page/actions/workflows/firebase-hosting-pull-request.yml)
[![Deploy to Live](https://github.com/HearMeTech/landing-page/actions/workflows/firebase-hosting-merge.yml/badge.svg)](https://github.com/HearMeTech/landing-page/actions/workflows/firebase-hosting-merge.yml)

This is a simple static website that serves as the official landing page for the "Hear Me" project.

It is designed to be hosted on the **Firebase Hosting** platform and is built using **Tailwind CSS** for a modern, responsive design.

## **🌟 Key Features**

* **Home Page (`index.html`):** The primary page that introduces visitors to our project, vision, features, and pricing.
* **Component-Based Structure:** Shared elements like the header and footer are loaded from the `/components` directory via JavaScript for easy maintenance.
* **Separate Pages:** Additional pages (like `coming-soon.html`) are organized in the `/pages` directory.
* **Maintenance Page (`maintenance.html`):** A temporary page to display during scheduled maintenance, complete with a countdown timer.
* **Custom 404 Page (`404.html`):** A user-friendly "Not Found" page.
* **JavaScript (`script.js`):** Contains shared logic, including the mobile menu toggle for index.html, loading header/footer and the countdown timer for `maintenance.html`.
* **Custom Styles (`style.css`):** A minimal stylesheet primarily used for custom animations (like the spinning gear on the maintenance page).
* **Responsive Design:** The site uses Tailwind CSS for a mobile-first, responsive layout.

## **🛠️ How to Test Locally**

Testing our project involves two key steps:
1.  **Running the Quality Linter:** Checking the code for errors and style issues.
2.  **Running the Local Server:** Previewing the website visually in your browser.

### Prerequisites

Before you begin, ensure you have:
1.  **Node.js and npm:** (This provides the `npm` command).
2.  **Firebase CLI:** If you don't have it, install it globally:
```bash
npm install -g firebase-tools
```

### Step 1: Install Dependencies

After cloning the repository, you must first install the local development tools (linters):
```bash
npm install
```

### Step 2: Check Code Quality (Linting)

Before any commit, run our complete quality check. This command checks all `HTML`, `CSS`, and `JavaScript` files for errors, ensuring our code stays clean and consistent.
```bash
npm run lint
```

**If this command shows errors, please fix them before proceeding.**

### Step 3: **Running the Local Server**

1. **Log in to Firebase:** (This step might be optional for firebase serve, but it's good practice).
```bash
    firebase login
```

2. **Run the server:** While in the project's root directory (where firebase.json is located), execute the following command:
```bash
    firebase serve
```

3. **Open the site in your browser:** After running the command, the terminal will show you a local address. By default, it is: `http://localhost:5000`
   * Main page: `http://localhost:5000` (or `http://localhost:5000/index.html`)
   * Maintenance page: `http://localhost:5000/maintenance.html`
   * 404 Page: Navigate to any non-existent URL (e.g., `http://localhost:5000/test`)

## **🚀 Deployment**

Deployment is handled automatically.

Any push or pull request merge to the `main` branch will trigger an automatic deployment to Firebase Hosting.

## **📁 File Structure**

* `.github/`: Contains CI/CD workflows and linter configurations.
* `public/`: Contains all static assets, components, and content pages.
    * `components/`: Reusable HTML partials (header, footer).
    * `images/`: Brand logos and other images.
    * `pages/`: Additional content pages (e.g., coming-soon).
    * `scripts/`: JavaScript files.
    * `styles/`: CSS stylesheets.
    * `index.html`: The main landing page (hosting root).
    * `404.html`: Custom 404 error page.
    * `maintenance.html`: "Under Maintenance" page.
* `firebase.json`: Firebase configuration file.
* `package.json`: Manages npm dependencies (linters) and scripts.
* `eslint.config.js`: Configuration for ESLint.
* `.stylelintrc.json`: Configuration for Stylelint.
* `.gitignore`: Specifies files for Git to ignore.
* `README.md`: This file.

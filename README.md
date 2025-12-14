# **HearMe Landing Page**
[![PR Linter & Preview](https://github.com/HearMeTech/landing-page/actions/workflows/firebase-hosting-pull-request.yml/badge.svg)](https://github.com/HearMeTech/landing-page/actions/workflows/firebase-hosting-pull-request.yml)
[![Deploy to Live](https://github.com/HearMeTech/landing-page/actions/workflows/firebase-hosting-merge.yml/badge.svg)](https://github.com/HearMeTech/landing-page/actions/workflows/firebase-hosting-merge.yml)

This is a simple static website that serves as the official landing page for the **HearMe** project.

It is designed to be hosted on the **Firebase Hosting** platform and is built using **Tailwind CSS** (via CLI) for a modern, responsive design.

## **🌟 Key Features**

* **Home Page (`index.html`):** The primary page that introduces visitors to our project, vision, features, and roadmap.
* **Waitlist Page (`pages/waitlist.html`):** A dedicated page with a form to capture emails, integrated with Firebase Firestore.
* **Internationalization (i18n):** Client-side translation support. Automatically detects user language, saves preferences, and supports multiple languages (EN, UK, DE, ES, FR, PT).
* **Automated CI/CD:** GitHub Actions pipeline automatically builds CSS, updates version timestamps (cache-busting), and deploys to Firebase.
* **Optimized CSS:** Uses Tailwind CLI to generate a minified, production-ready CSS file.

## **🎨 Styling & CSS**

We use **Tailwind CSS v3** via CLI.

### **Development Workflow**
The **GitHub Actions pipeline** handles the production build automatically. However, to see style changes while developing locally, you must run the build command.

1. Make your changes to HTML/JS files or `tailwind.config.js`.
2. Run the CSS build command to update local styles:
   ```bash
   npm run build:css
   ```
   *(This generates `public/styles/tailwind.css` based on your changes)*.

## **🛠️ How to Test Locally**

### Prerequisites

1. **Node.js and npm:** Required for building CSS and linting.
2. **Firebase CLI:** `npm install -g firebase-tools`

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Build CSS

Before running the server, ensure styles are generated:
```bash
npm run build:css
```

### Step 3: Refresh Caching (Optional)

If you want to test the versioning script locally:
```bash
npm run update-version
```

### Step 4: Run Local Server

```bash
firebase serve
```
Open `http://localhost:5000` to see the site.

## **🌍 Localization (i18n)**

The project uses a lightweight client-side approach for translations.

1.  **JSON Files:** Content is stored in `public/locales/{lang}.json` (e.g., `en.json`, `uk.json`).
2.  **HTML Attributes:** Elements have `data-i18n="key.path"`.
    * Example: `<h1 data-i18n="hero.title">Default Text</h1>`
3.  **Language Detection:** `i18n.js` checks: URL param -> LocalStorage -> Browser -> Default (`en`).

To add a language, create a JSON file in `public/locales/` and update the `<select>` in `header.html`.

## **🚀 Deployment**

### **Automatic (Recommended)**
Simply push your changes to the `main` branch.
GitHub Actions will automatically:
1. Install dependencies.
2. Build optimized CSS (`npm run build:css`).
3. Update version timestamps (`npm run update-version`).
4. Deploy to Firebase Hosting.

### **Manual (Fallback)**
To deploy manually from your machine:

```bash
npm run deploy
```
*This command locally rebuilds CSS, updates the version timestamp, and deploys to Firebase.*

## **📁 File Structure**

* `.github/`: CI/CD workflows.
* `src/`: Source files for compilation.
  * `input.css`: Tailwind entry point (`@tailwind` directives).
* `public/`: Hosting root (static assets).
  * `components/`: HTML partials (header, footer).
  * `locales/`: Translation files (`en.json`, `uk.json`, etc.).
  * `styles/`:
    * `tailwind.css`: **Generated** Tailwind styles (do not edit manually).
    * `style.css`: Custom animations (spinner, etc.).
  * `scripts/`:
    * `i18n.js`: Localization logic.
    * `common.js`, `page-*.js`: Page logic.
    * `firebase-init.js`: Firebase setup.
  * `index.html`, `404.html`, `pages/`: Content pages.
* `tailwind.config.js`: Tailwind configuration (colors, fonts).
* `firebase.json`: Hosting config (caching rules).
* `package.json`: Scripts and dependencies.
* `update-version.js`: Versioning script for cache busting.

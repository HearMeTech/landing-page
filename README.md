# **HearMe Landing Page**
[![PR Linter & Preview](https://github.com/HearMeTech/landing-page/actions/workflows/firebase-hosting-pull-request.yml/badge.svg)](https://github.com/HearMeTech/landing-page/actions/workflows/firebase-hosting-pull-request.yml)
[![Deploy to Live](https://github.com/HearMeTech/landing-page/actions/workflows/firebase-hosting-merge.yml/badge.svg)](https://github.com/HearMeTech/landing-page/actions/workflows/firebase-hosting-merge.yml)

This is a simple static website that serves as the official landing page for the **HearMe** project.

It is designed to be hosted on the **Firebase Hosting** platform and is built using **Tailwind CSS** (via CLI) for a modern, responsive design.

## **🌟 Key Features**

* **Home Page (`index.html`):** The primary page that introduces visitors to our project, vision, features, and roadmap.
* **Waitlist Page (`pages/waitlist.html`):** A dedicated page with a form to capture emails, integrated with Firebase Firestore.
* **Internationalization (i18n):** Client-side translation support. Automatically detects user language, saves preferences, and supports multiple languages (EN, UK, DE, ES, FR, PT).
* **Optimized CSS:** Uses Tailwind CLI to generate a minified, production-ready CSS file without runtime overhead.
* **Modular JavaScript:** Logic is cleanly split into modules.

## **🎨 Styling & CSS (Important!)**

We use **Tailwind CSS v3** via CLI. Unlike the CDN version, styles are generated at build time.

### **⚠️ Critical Workflow for Deployment**
Since our GitHub Actions workflow **does not** build CSS automatically, you **must build it locally** before pushing changes.

1. Make your changes to HTML/JS files.
2. Run the CSS build command:
   ```bash
   npm run build:css
   ```
3. This will update `public/styles/tailwind.css`.
4. **Commit the generated `public/styles/tailwind.css` file** along with your other changes.

If you skip this step, the live site will not reflect your styling changes!

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

### Step 3: Refrtesh cashing

Before running the server, ensure versions are updated:
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

To deploy manually (bypassing GitHub Actions):

```bash
npm run deploy
```
*This command automatically rebuilds CSS, updates the version timestamp, and deploys to Firebase.*

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
* `firebase.json`: Hosting config.
* `package.json`: Scripts and dependencies.
* `update-version.js`: Versioning script.

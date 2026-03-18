# **HearMe Landing Page**
[![PR Linter & Preview](https://github.com/HearMeTech/landing-page/actions/workflows/firebase-hosting-pull-request.yml/badge.svg)](https://github.com/HearMeTech/landing-page/actions/workflows/firebase-hosting-pull-request.yml)
[![Deploy to Live](https://github.com/HearMeTech/landing-page/actions/workflows/firebase-hosting-merge.yml/badge.svg)](https://github.com/HearMeTech/landing-page/actions/workflows/firebase-hosting-merge.yml)

This is the official landing page for the **HearMe** project. 

It is built as a **Custom Static Site Generator (SSG)** using Node.js to provide lightning-fast performance, flawless Technical SEO, and true internationalization. It is designed to be hosted on **Firebase Hosting** and uses **Tailwind CSS** for styling.

## **🌟 Key Features**

* **Custom SSG Architecture:** A custom Node.js build script (`build.js`) compiles source files into a production-ready `public/` directory.
* **True Internationalization (i18n) & SEO:** * Translations are injected at build-time.
  * Generates physical subdirectories for each language (e.g., `/uk/`, `/de/`) for perfect indexing.
  * Automatically injects `hreflang` tags and localized `canonical` URLs into the `<head>`.
* **Smart Routing:** Automatically detects the user's browser language or saved preferences and seamlessly redirects them to the appropriate localized page.
* **Automated SEO Files:** Dynamically generates `sitemap.xml` (with current build dates for `lastmod`) and `robots.txt` based on the configured languages.
* **Cache-Busting:** Native asset versioning to ensure users always receive the latest CSS and scripts.
* **Config-Driven:** A single `config.json` acts as the source of truth for available languages across the entire app.
* **Automated CI/CD:** GitHub Actions pipeline automatically lints the code, builds the static site, and deploys it to Firebase upon merging.

## **🛠️ Development Workflow**

All development happens inside the `src/` directory. **Never edit files in the `public/` directory manually**, as they are overwritten during the build process.

### Prerequisites

1. **Node.js and npm:** Required for the build script and linters.
2. **Firebase CLI:** `npm install -g firebase-tools` (for local serving and manual deployment).

### Step 1: Install Dependencies

```bash
npm ci
```

### Step 2: Build the Project

To compile HTML templates, inject translations, generate SEO files, and build Tailwind CSS:
```bash
npm run build
```
*(This cleans the `public/` directory and regenerates the entire site from scratch).*

### Step 3: Test Locally

```bash
firebase serve --only hosting
```
Open `http://localhost:5000` to preview the compiled site.

## **🔍 Code Quality (Linting)**

We strictly enforce code quality using linters for HTML, CSS, and JS. 
To check your code before committing:

```bash
npm run lint
```
*(The CI/CD pipeline will fail if there are any linting errors).*

## **🌍 Localization (i18n)**

Adding or managing languages is centralized and highly automated.

1. **Global Config:** The `config.json` in the root directory holds the `defaultLang` and `supportedLangs` array. 
2. **Translation Files:** Content is stored in `src/locales/{lang}.json` (e.g., `en.json`, `uk.json`).
3. **Usage in HTML:** Use the `data-i18n` attribute in your `src/*.html` files:
   ```html
   <h1 data-i18n="hero.title">Default Text</h1>
   ```
4. **Build Process:** When `npm run build` is executed, it reads `config.json`, iterates through all supported languages, translates the HTML, and generates localized directories in `public/`.

## **🚀 Deployment**

### **Automatic (Recommended)**
Direct pushes to the `main` branch are restricted. To deploy your changes, please follow the standard Pull Request (PR) workflow:

1. Create a new branch for your feature or fix.
2. Commit and push your changes to your branch.
3. Open a **Pull Request** against the `main` branch. *(This will trigger the PR Linter & Preview workflow to verify your code).*
4. Once your PR is approved and merged into `main`, the GitHub Actions pipeline will automatically:
   * Setup the environment and install dependencies (`npm ci`).
   * Run Linters to ensure code quality (`npm run lint`).
   * Build the project and generate the `public/` folder (`npm run build`).
   * Deploy the compiled assets to Firebase Hosting.

### **Manual (Fallback)**
If you need to deploy manually from your local machine:
```bash
npm run deploy
```

## **📁 File Structure**

```text
├── .github/              # CI/CD workflows and linter configs
├── src/                  # 🛠️ SOURCE FILES (Work Here)
│   ├── assets/           # Images, icons, manifests
│   ├── components/       # Reusable HTML partials (header.html, footer.html)
│   ├── locales/          # Translation dictionaries (*.json)
│   ├── scripts/          # JavaScript files (common.js, firebase-init.js, etc.)
│   ├── styles/           # CSS files (input.css, style.css)
│   ├── index.html        # Main landing page template
│   ├── invest.html       # Investors page template
│   ├── waitlist.html     # Waitlist page template
│   ├── maintenance.html  # Maintenance page template
│   └── 404.html          # Error page template
├── public/               # 📦 COMPILED OUTPUT (Generated automatically, do not edit)
├── build.js              # Custom Static Site Generator script
├── config.json           # Global configuration (languages, etc.)
├── tailwind.config.js    # Tailwind CSS configuration
├── eslint.config.js      # ESLint configuration
├── .stylelintrc.json     # Stylelint configuration
├── firebase.json         # Firebase Hosting configuration (rewrites, headers)
└── package.json          # NPM scripts and dependencies
```

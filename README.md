# "Hear Me" Landing Page

This is a simple static website that serves as landing page for the "Hear Me" project.

It is designed to be hosted on the **Firebase Hosting** platform.

## 🌟 Key Features

* **Home Page (`index.html`):** The main page that informs visitors about out project.
* **File with JavaScripts (`script.js`):** Conteins the scripts used in this project.
* **Custom 404 Page (`404.html`):** A custom "Not Found" page in case a user navigates to an incorrect URL.
* **Responsive Design (`style.css`):** The page displays correctly on both mobile devices and desktops.

## 🛠️ How to Test Locally

This project is configured to work with **Firebase Hosting**. You can easily run a local server to test all pages before deploying them.

### Prerequisites

Before you begin, ensure you have the **Firebase CLI** (Command Line Tools) installed.

If you don't have it, install it globally via npm:

```bash
npm install -g firebase-tools
```

### Running the Local Server

1. **Log in to Firebase:** (This step might be optional for `firebase serve`, but it's good practice).
```bash
firebase login
```

2. **Run the server:** While in the project's root directory (where `firebase.json` is located), execute the following command:
```bash
firebase serve
```

3. **Open the site in your browser:** After running the command, the terminal will show you a local address. By default, it is: http://localhost:5000

## 🚀 Deployment

Deployment is handled automatically.

Any push or pull request merge to the `main` branch will trigger an automatic deployment to Firebase Hosting.

## 📁 File Structure

* `.github/workflows`: The directory containing CD/CI instructions for GitHub
* `public/`: The directory containing all static content.
    * `index.html`: The main landing page.
    * `404.html`: The error page.
    * `style.css`: All styles.
    * `script.js`: All scripts.
* `.firebaserc`: Contains your Firebase project ID ("hear-me-landing").
* `firebase.json`: The main Firebase configuration file. It specifies that public is the root directory for hosting.
* `.gitignore`: A standard file for ignoring files in Git (e.g., node_modules).
* `README.md`: This file.

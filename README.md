# **"Hear Me" Landing Page**

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

This project is configured to work with **Firebase Hosting**. You can easily run a local server to test all pages before deploying them.

### **Prerequisites**

Before you begin, ensure you have the **Firebase CLI** (Command Line Tools) installed.

If you don't have it, install it globally via `npm`:
```bash
npm install \-g firebase-tools
```

### **Running the Local Server**

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

* `.github/workflows`: The directory containing CD/CI instructions for GitHub (if used).
* `public/`: The root directory for Firebase Hosting.
  * `index.html`: The main landing page.
  * `404.html`: The 404 error page.
  * `maintenance.html`: The scheduled maintenance page.
  * `components/`: Contains reusable HTML snippets.
    * `header.html`
    * `footer.html`
  * `pages/`: Contains all secondary website pages.
    * `coming-soon.html`
  * `images/`: Contains all static image assets.
    * `Hear-Me-Logo.png`
    * `Hear-Me.png`
  * `scripts/`: Contains all JavaScript files.
    * `script.js` (handles component loading, mobile menu, and maintenance timer)
  * `styles/`: Contains all CSS files.
    * `style.css` (global styles, font imports, animations)
* `.firebaserc`: Contains your Firebase project ID ("hear-me-landing").
* `firebase.json`: The main Firebase configuration file. It specifies public as the root directory for hosting.
* `.gitignore`: A standard file for ignoring files in Git.
* `README.md`: This file.

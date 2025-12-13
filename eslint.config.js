// eslint.config.js
import globals from "globals";
import js from "@eslint/js";

export default [
  js.configs.recommended,

  {
    ignores: [
      "tailwind.config.js",
      ".firebase/**"
    ]
  },

  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: "module",
      globals: {
        ...globals.browser,
        // Add all environment-provided globals here
        '__app_id': 'readonly',
        '__firebase_config': 'readonly',
        '__initial_auth_token': 'readonly',
        'tailwind': 'readonly',
        'firebase': 'readonly' // Add window.firebase if we ever use it
      }
    },
    rules: {
      // For the future
    }
  }
];

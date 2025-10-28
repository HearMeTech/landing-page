// eslint.config.js
import globals from "globals";
import js from "@eslint/js";

export default [
  js.configs.recommended,

  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: "module",
      globals: {
        ...globals.browser 
      }
    },
    rules: {
      // For the future
    }
  }
];

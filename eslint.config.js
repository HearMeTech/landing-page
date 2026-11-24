// eslint.config.js
import globals from 'globals';
import js from '@eslint/js';

export default [
    // 1. Global ignores (build outputs, vendor, and tooling configs)
    {
        ignores: [
            'public/**',
            '.firebase/**',
            'node_modules/**',
            'tailwind.config.js'
        ]
    },

    // 2. ESLint recommended baseline
    js.configs.recommended,

    // 3. Browser ES modules (frontend application scripts)
    {
        files: ['src/**/*.js'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                ...globals.browser,
                // Environment-injected Firebase preview/runtime globals
                __app_id: 'readonly',
                __firebase_config: 'readonly',
                __initial_auth_token: 'readonly'
            }
        }
    },

    // 4. Node.js build & tooling scripts
    {
        files: ['build.js', 'eslint.config.js', 'tools/**/*.{js,mjs}'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                ...globals.node
            }
        }
    },

    // 5. Shared quality & safety rules across all project JS files
    {
        files: ['**/*.{js,mjs}'],
        rules: {
            // Bug prevention & modern JS discipline
            'no-var': 'error',
            'prefer-const': ['error', { destructuring: 'all' }],
            'eqeqeq': ['error', 'always', { null: 'ignore' }],
            'no-duplicate-imports': 'error',
            'no-eval': 'error',
            'no-implied-eval': 'error',
            'no-throw-literal': 'error',
            'no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                    caughtErrorsIgnorePattern: '^_'
                }
            ],

            // Maintainability hints (warnings so existing files don't block CI)
            'no-shadow': 'warn',
            'object-shorthand': ['warn', 'always'],
            'prefer-template': 'warn',
            'no-useless-return': 'warn'
        }
    }
];

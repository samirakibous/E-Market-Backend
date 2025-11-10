import js from '@eslint/js';
import globals from 'globals';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  {
    files: ['**/*.{js,mjs,cjs}'],
    plugins: { js },
    extends: ['js/recommended'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    rules: {
      'no-unused-vars': ['error', { 
        argsIgnorePattern: '^(next|error|_|sellerId)',
        varsIgnorePattern: '^(_|coupon|productFactory|uri|Order|outputFormat)'
      }],
      'no-unexpected-multiline': 'off'
    }
  },
  {
    files: ['test/**/*.js', '**/*.test.js'],
    languageOptions: {
      globals: {
        ...globals.mocha,
      },
    },
    rules: {
      'no-unused-vars': 'off'
    }
  },
]);

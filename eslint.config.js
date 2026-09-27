// Configuration ESLint « flat » du projet Sama Waay.
// - typescript-eslint : règles recommandées TypeScript ;
// - react-hooks : règles des hooks en ERREUR (FE-1) ;
// - jsx-a11y : règles d'accessibilité en AVERTISSEMENT (dette suivie, non bloquante).
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';

const a11yWarnings = Object.fromEntries(
  Object.entries(jsxA11y.flatConfigs.recommended.rules)
    .filter(([, level]) => level !== 'off')
    .map(([rule]) => [rule, 'warn']),
);

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'node_modules', 'public/sw.js'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser },
    },
    plugins: {
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
      ...a11yWarnings,
      'no-console': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['*.config.{js,ts}', 'eslint.config.js'],
    languageOptions: { globals: { ...globals.node } },
  },
);

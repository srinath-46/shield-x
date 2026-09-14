import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import prettier from 'eslint-config-prettier'

export default tseslint.config(
  { ignores: ['out/**', 'dist/**', 'node_modules/**', 'artifacts/**'] },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ['src/renderer/**/*.{ts,tsx}', 'test/**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: { jsx: true }
      },
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        URL: 'readonly',
        Blob: 'readonly',
        ResizeObserver: 'readonly',
        HTMLElement: 'readonly',
        HTMLInputElement: 'readonly',
        HTMLDivElement: 'readonly',
        HTMLFormElement: 'readonly',
        SVGSVGElement: 'readonly',
        KeyboardEvent: 'readonly',
        PointerEvent: 'readonly',
        MouseEvent: 'readonly',
        Event: 'readonly',
        Node: 'readonly',
        JSX: 'readonly'
      }
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // The accessibility work in phase 2 is worth guarding automatically.
      ...jsxA11y.flatConfigs.recommended.rules,
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }]
    }
  },

  {
    files: ['src/main/**/*.ts', 'src/preload/**/*.ts', '*.config.ts'],
    languageOptions: {
      globals: {
        process: 'readonly',
        __dirname: 'readonly',
        window: 'readonly',
        console: 'readonly'
      }
    }
  },

  {
    files: ['scripts/**/*.cjs'],
    // Electron's main process is CommonJS; require() is correct here.
    rules: { '@typescript-eslint/no-require-imports': 'off' },
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        require: 'readonly',
        module: 'writable',
        process: 'readonly',
        console: 'readonly',
        __dirname: 'readonly',
        setTimeout: 'readonly'
      }
    }
  },

  // Formatting belongs to Prettier; this must stay last.
  prettier
)

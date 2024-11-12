import eslint from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import tsEslintConfig from 'typescript-eslint'

import prettierPluginEslint from 'eslint-plugin-prettier/recommended'

import eslintConfigPrettier from 'eslint-config-prettier'

// TODO : when eslint-plugin-vuetify support eslint v9, remove this subfolder and install the package from
// https://github.com/vuetifyjs/eslint-plugin-vuetify/issues/93
import pluginVuetify from './eslint-plugin-vuetify/src/configs/flat/base.js'

export default [
  {
    ignores: ['./eslint.config.mjs'],
    languageOptions: {
      parser: 'vue-eslint-parser',
      parserOptions: {
        parser: '@typescript-eslint/parser',
      },
    },
  },

  eslint.configs.recommended,
  ...tsEslintConfig.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  pluginVuetify,
  prettierPluginEslint,
  eslintConfigPrettier,

  {
    files: ['**/*.ts', '**/*.js', '**/*.vue'],
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/no-invalid-this': ['error'],
      '@typescript-eslint/no-shadow': 'error',
      '@typescript-eslint/no-unused-expressions': 'error',
      '@typescript-eslint/no-unused-vars': ['error'],
      '@typescript-eslint/prefer-for-of': 'error',
      'comma-dangle': 'off',
      'consistent-return': 'error',
      eqeqeq: 'error',
      'no-await-in-loop': 'warn',
      'no-fallthrough': 'error',
      'no-invalid-this': 'off',
      'no-param-reassign': 'error',
      'no-nested-ternary': 'error',
      'no-use-before-define': ['error', { variables: false, functions: false }],
      'prefer-template': 'warn',
      'vue/valid-v-slot': ['error', { allowModifiers: true }],
      'vue/multi-word-component-names': 'off',
    },
  },

  {
    ignores: ['eslint-plugin-vuetify/'],
  },
]

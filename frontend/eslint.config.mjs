import eslint from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import tsEslintConfig from 'typescript-eslint'

import prettierPluginEslint from 'eslint-plugin-prettier/recommended'

import eslintConfigPrettier from 'eslint-config-prettier'

import vuetify from 'eslint-plugin-vuetify'
import vuetifyBase from 'eslint-plugin-vuetify/lib/configs/base.js'

// Monté à la main : le `flat/base` du paquet redéclare le plugin `vue`, ce qui entre en conflit
// avec pluginVue.configs['flat/recommended'] chargé plus haut (« Cannot redefine plugin "vue" »)
const pluginVuetify = {
  files: ['*.vue', '**/*.vue'],
  plugins: { vuetify },
  rules: { ...vuetifyBase.rules },
}

export default [
  { ignores: ['dist/**', 'eslint.config.mjs'] },

  {
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
      'vue/require-default-prop': 'off',
    },
  },
]

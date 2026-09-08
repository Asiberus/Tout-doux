import { VuetifyOptions } from 'vuetify'
import 'vuetify/styles'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import { en } from 'vuetify/locale'

export const vuetifyOptions: VuetifyOptions = {
  defaults: {
    VTextField: { variant: 'underlined' },
    VTextarea: { variant: 'underlined' },
    VSelect: { variant: 'underlined' },
    VAutocomplete: { variant: 'underlined' },
    VCombobox: { variant: 'underlined' },
    VFileInput: { variant: 'underlined' },
    VSwitch: { color: 'primary' },
    VDialog: { transition: 'scale-transition' },
  },
  // Pendant JS de `src/styles/_breakpoint-values.scss` : les deux doivent rester alignés
  display: {
    thresholds: { xs: 0, sm: 600, md: 960, lg: 1280, xl: 1920, xxl: 2560 },
  },
  theme: {
    defaultTheme: 'dark',
    themes: {
      light: {
        colors: {
          primary: '#ee44aa',
          secondary: '#424242',
          accent: '#82B1FF',
          stepperInactive: '#757575',
          'on-stepperInactive': '#000',
          error: '#FF5252',
          info: '#2196F3',
          success: '#4CAF50',
          warning: '#FFC107',
        },
      },
      dark: {
        colors: {
          primary: '#ee44aa',
          secondary: '#424242',
          accent: '#82B1FF',
          stepperInactive: '#757575',
          'on-stepperInactive': '#000',
          info: '#2196F3',
          success: '#4CAF50',
          warning: '#FFC107',
          error: '#FF5252',
          // Vuetify 4 ne livre pas la famille `surface-container-*` de MD3 : `surface` (#212121)
          // est le seul ton de carte disponible, pour quatre niveaux qui se superposent
          'surface-container-high': '#2e2e2e',
          'surface-container-highest': '#3a3a3a',
          taskCompleted: '#497549',
          // taskCompleted: '#4CAF50',
          taskInCreation: '#181b1f',
          projectArchivedCard: '#363e4d',
          collectionArchived: '#363e4d',
          project: '#004D40',
          antiProject: '#99b7b2',
          projectArchived: '#82B1FF',
          antiProjectArchived: '#d9e7ff',
          collection: '#827717',
          passedEvent: '#191919',
          event: '#009688', // Teal
        },
      },
    },
  },
  locale: {
    locale: 'en',
    messages: { en },
  },
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: { mdi },
  },
}

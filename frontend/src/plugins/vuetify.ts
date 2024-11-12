import { VuetifyOptions } from 'vuetify'
import 'vuetify/dist/vuetify.min.css'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import { en } from 'vuetify/locale'
import { VCalendar } from 'vuetify/labs/VCalendar'

export const vuetifyOptions: VuetifyOptions = {
  components: {
    VCalendar,
  },
  theme: {
    defaultTheme: 'dark',
    themes: {
      light: {
        primary: '#ee44aa',
        secondary: '#424242',
        accent: '#82B1FF',
        error: '#FF5252',
        info: '#2196F3',
        success: '#4CAF50',
        warning: '#FFC107',
      },
      dark: {
        primary: '#ee44aa',
        secondary: '#424242',
        accent: '#82B1FF',
        error: '#FF5252',
        info: '#2196F3',
        success: '#4CAF50',
        warning: '#FFC107',
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

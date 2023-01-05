import Vue from 'vue'
import Vuetify from 'vuetify'
import 'vuetify/dist/vuetify.min.css'
import fr from 'vuetify/src/locale/fr'

Vue.use(Vuetify)

export default new Vuetify({
    theme: {
        dark: true,
        options: {
            customProperties: true,
        },
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
    lang: {
        locales: { fr },
        current: 'fr',
    },
    icons: {
        iconfont: 'mdi',
    },
})

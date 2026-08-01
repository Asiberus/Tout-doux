import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createVuetify } from 'vuetify'
import { createPinia } from 'pinia'
import { vuetifyOptions } from '@/plugins/vuetify'

const app = createApp(App)

const pinia = createPinia()
const vuetify = createVuetify(vuetifyOptions)

app.use(router)
app.use(pinia)
app.use(vuetify)

app.mount('#app')

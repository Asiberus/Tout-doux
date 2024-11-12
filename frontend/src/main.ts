import { createApp } from 'vue'
import App from './App.vue'
// TODO : See if we can remove registerServiceWorker dependency
import './registerServiceWorker'
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

// Vue.config.productionTip = false

// new Vue({
//   router,
//   store,
//   vuetify,
//   render: h => h(App),
// }).$mount('#app')

app.mount('#app')

import Vue from 'vue'
import App from './App.vue'
import './registerServiceWorker'
import router from './router'
import store from './store'
import vuetify from './plugins/vuetify'
import VueResource from 'vue-resource'
import { config } from '@/config'

// Todo : add interceptor for response body
Vue.use(VueResource)
Vue.http.options.root = config.API_URL
Vue.config.productionTip = false

new Vue({
    router,
    store,
    vuetify,
    render: h => h(App),
}).$mount('#app')

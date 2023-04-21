import Vue from 'vue'
import App from './App.vue'
import './registerServiceWorker'
import router from './router'
import store from './store'
import vuetify from './plugins/vuetify'
import VueResource from 'vue-resource'
import { config } from '@/config'
import { authService } from '@/services'
import { HttpOptions, HttpResponse } from 'vue-resource/types/vue_resource'
import VueRouter from 'vue-router'

Vue.use(VueRouter)
Vue.router = router

// Todo : add interceptor for response body
Vue.use(VueResource)
Vue.http.options.root = config.API_URL ?? ''

Vue.http.interceptors.push((request: HttpOptions) => {
    if (authService.isAuthenticated())
        request.headers.set('Authorization', `Bearer ${authService.getToken()}`)
})

Vue.http.interceptors.push(() => {
    return (response: HttpResponse) => {
        if (response.status === 401) {
            authService.removeToken()
            Vue.router.push({ name: 'login' })
        }
    }
})

Vue.config.productionTip = false

new Vue({
    router,
    store,
    vuetify,
    render: h => h(App),
}).$mount('#app')

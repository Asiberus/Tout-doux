import VueRouter from 'vue-router'
import { Store } from 'vuex'

declare module 'vue/types/vue' {
    interface VueConstructor {
        http: any
        router: VueRouter
        store: Store<any>
    }
}

import VueRouter from 'vue-router'
import { Store } from 'vuex'
import { StoreInterface } from '@/store/store.interface'

declare module 'vue/types/vue' {
    interface VueConstructor {
        http: any
        router: VueRouter
        store: Store<StoreInterface>
    }
}

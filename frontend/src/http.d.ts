import VueRouter from 'vue-router'

declare module 'vue/types/vue' {
    interface VueConstructor {
        http: any
        router: VueRouter
    }
}

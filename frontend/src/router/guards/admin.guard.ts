import { NavigationGuard, NavigationGuardNext, Route } from 'vue-router/types/router'
import { User } from '@/models/user.model'
import store from '@/store'

export const adminGuard: NavigationGuard = (to: Route, from: Route, next: NavigationGuardNext) => {
    const user: User | undefined = store.state.user.user
    if (!user || !user.isStaff) next({ name: 'home' })
    else next()
}

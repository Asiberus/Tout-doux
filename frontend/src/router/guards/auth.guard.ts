import { NavigationGuard, NavigationGuardNext, Route } from 'vue-router/types/router'
import { authService } from '@/services'

export const authGuard: NavigationGuard = (to: Route, from: Route, next: NavigationGuardNext) => {
    if (to.name !== 'login' && !authService.isAuthenticated())
        next({ name: 'login', query: { next: to.fullPath } })
    else next()
}

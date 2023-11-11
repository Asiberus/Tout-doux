import { NavigationGuard, NavigationGuardNext, Route } from 'vue-router/types/router'
import { authService } from '@/services'
import { authRoutes } from '@/router/modules/auth.router'

const NON_AUTH_ROUTES: (string | undefined | null)[] = authRoutes.map(route => route.name)

export const authGuard: NavigationGuard = (to: Route, from: Route, next: NavigationGuardNext) => {
    if (!NON_AUTH_ROUTES.includes(to.name) && !authService.isAuthenticated())
        next({ name: 'login', query: { next: to.fullPath } })
    else next()
}

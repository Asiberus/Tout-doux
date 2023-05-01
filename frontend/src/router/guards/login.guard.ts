import { NavigationGuard, NavigationGuardNext, Route } from 'vue-router/types/router'
import { authService } from '@/services'

export const loginGuard: NavigationGuard = (to: Route, from: Route, next: NavigationGuardNext) => {
    if (authService.isAuthenticated()) next({ name: 'home' })
    else next()
}

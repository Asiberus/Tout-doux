import {
  NavigationGuard,
  NavigationGuardNext,
  RouteLocationNormalized,
  RouteLocationNormalizedLoaded,
} from 'vue-router'
import { authService } from '@/services'
import { nonAuthRoutes } from '@/router/modules/nonAuth.router'

const NON_AUTH_ROUTES: (string | undefined | null)[] = nonAuthRoutes.map(route => route.name)

export const authGuard: NavigationGuard = (
  to: RouteLocationNormalized,
  from: RouteLocationNormalizedLoaded,
  next: NavigationGuardNext
) => {
  if (!authService.isAuthenticated() && !NON_AUTH_ROUTES.includes(to.name))
    next({ name: 'login', query: { next: to.fullPath } })
  else next()
}

import { NavigationGuard, RouteRecordNameGeneric } from 'vue-router'
import { authService } from '@/services'
import { nonAuthRoutes } from '@/router/modules/nonAuth.router'

const NON_AUTH_ROUTES: RouteRecordNameGeneric[] = nonAuthRoutes.map(route => route.name)

export const authGuard: NavigationGuard = to => {
  if (!authService.isAuthenticated() && !NON_AUTH_ROUTES.includes(to.name))
    return { name: 'login', query: { next: to.fullPath } }
  return undefined
}

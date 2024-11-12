import {
  NavigationGuard,
  NavigationGuardNext,
  RouteLocationNormalized,
  RouteLocationNormalizedLoaded,
} from 'vue-router'
import { authService } from '@/services'

export const loginGuard: NavigationGuard = (
  to: RouteLocationNormalized,
  from: RouteLocationNormalizedLoaded,
  next: NavigationGuardNext
) => {
  if (authService.isAuthenticated()) next({ name: 'home' })
  else next()
}

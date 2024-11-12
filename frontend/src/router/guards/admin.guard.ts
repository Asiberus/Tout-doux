import { useUserStore } from '@/store'
import {
  NavigationGuard,
  NavigationGuardNext,
  RouteLocationNormalized,
  RouteLocationNormalizedLoaded,
} from 'vue-router'

export const adminGuard: NavigationGuard = (
  to: RouteLocationNormalized,
  from: RouteLocationNormalizedLoaded,
  next: NavigationGuardNext
): void => {
  const userStore = useUserStore()
  if (!userStore.user || !userStore.user.isStaff) next({ name: 'home' })
  else next()
}

import { NavigationGuard } from 'vue-router'
import { authService } from '@/services'

export const loginGuard: NavigationGuard = () => {
  if (authService.isAuthenticated()) return { name: 'home' }
  return undefined
}

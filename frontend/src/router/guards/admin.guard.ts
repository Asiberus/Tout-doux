import { useUserStore } from '@/store'
import { NavigationGuard } from 'vue-router'

export const adminGuard: NavigationGuard = () => {
  const userStore = useUserStore()
  if (!userStore.user || !userStore.user.isStaff) return { name: 'home' }
  return undefined
}

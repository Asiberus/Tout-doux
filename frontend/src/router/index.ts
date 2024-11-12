import Agenda from '@/views/agenga/Agenda.vue'
import {
  createRouter,
  createWebHistory,
  NavigationGuardNext,
  RouteLocationNormalized,
  RouteLocationNormalizedLoaded,
  START_LOCATION,
} from 'vue-router'
import { authGuard } from '@/router/guards'
import AuthenticatedLayout from '@/layout/AuthenticatedLayout.vue'
import NonAuthenticatedLayout from '@/layout/NonAuthenticatedLayout.vue'
import {
  administrationRoutes,
  collectionRoutes,
  dailyRoutes,
  nonAuthRoutes,
  profileRoute,
  projectRoutes,
  settingsRoutes,
} from '@/router/modules'
import { useAppStore } from '@/store'
import { authService } from '@/services'
import FeedbackComponent from '@/views/feedback/Feedback.vue'

console.log('ENV BASE URL =>', process.env.BASE_URL)

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes: [
    {
      path: '',
      component: AuthenticatedLayout,
      children: [
        {
          path: '/',
          name: 'home',
          redirect: { name: 'daily-summary' },
        },
        {
          path: '/agenda',
          name: 'agenda',
          component: Agenda,
        },
        {
          path: '/feedback',
          name: 'feedback',
          component: FeedbackComponent,
        },
        ...projectRoutes,
        ...collectionRoutes,
        ...dailyRoutes,
        ...settingsRoutes,
        ...profileRoute,
        ...administrationRoutes,
      ],
    },
    {
      path: '',
      component: NonAuthenticatedLayout,
      children: nonAuthRoutes,
    },
  ],
})

// If the user is authenticated, fetch the user & preferences data
router.beforeEach(
  (to: RouteLocationNormalized, from: RouteLocationNormalizedLoaded, next: NavigationGuardNext) => {
    const appStore = useAppStore()
    if (from === START_LOCATION && authService.isAuthenticated()) appStore.init().then(next)
    else next()
  }
)
router.beforeEach(authGuard)

export default router

import Administration from '@/views/administration/Administration.vue'
import AdministrationUser from '@/views/administration/tabs/AdministrationUser.vue'
import { adminGuard } from '@/router/guards'
import AdministrationFeedback from '@/views/administration/tabs/AdministrationFeedback.vue'
import { RouteRecordRaw } from 'vue-router'

export const administrationRoutes: RouteRecordRaw[] = [
  {
    path: '/administration',
    component: Administration,
    beforeEnter: adminGuard,
    children: [
      {
        path: '',
        redirect: 'user-list',
      },
      {
        path: 'user-list',
        name: 'administration-user-list',
        component: AdministrationUser,
      },
      {
        path: 'feedback',
        name: 'administration-feedback',
        component: AdministrationFeedback,
      },
    ],
  },
]

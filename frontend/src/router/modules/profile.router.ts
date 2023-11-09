import { RouteConfig } from 'vue-router'
import ProfileComponent from '@/views/profile/Profile.vue'
import ProfileUser from '@/views/profile/tabs/ProfileUser.vue'
import ProfilePassword from '@/views/profile/tabs/ProfilePassword.vue'
import ProfileEmail from '@/views/profile/tabs/ProfileEmail.vue'

export const profileRoute: Array<RouteConfig> = [
    {
        path: '/profile',
        component: ProfileComponent,
        children: [
            {
                path: '',
                name: 'profile-user',
                component: ProfileUser,
            },
            {
                path: 'password',
                name: 'profile-password',
                component: ProfilePassword,
            },
            {
                path: 'email',
                name: 'profile-email',
                component: ProfileEmail,
            },
        ],
    },
]

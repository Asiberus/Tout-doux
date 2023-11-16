import { RouteConfig } from 'vue-router'
import ProfileComponent from '@/views/profile/Profile.vue'
import ProfileUser from '@/views/profile/tabs/ProfileUser.vue'
import ProfilePassword from '@/views/profile/tabs/ProfilePassword.vue'
import ProfileEmail from '@/views/profile/tabs/ProfileEmail.vue'
import ProfileAccount from '@/views/profile/tabs/ProfileAccount.vue'

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
                path: 'email',
                name: 'profile-email',
                component: ProfileEmail,
            },
            {
                path: 'account',
                name: 'profile-account',
                component: ProfileAccount,
            },
            {
                path: 'password',
                name: 'profile-password',
                component: ProfilePassword,
            },
        ],
    },
]

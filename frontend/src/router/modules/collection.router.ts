import CollectionDetailComponent from '@/views/collection/collection-detail/CollectionDetail.vue'
import CollectionSettings from '@/views/collection/collection-detail/tabs/CollectionSettings.vue'
import CollectionDescription from '@/views/collection/collection-detail/tabs/CollectionDescription.vue'
import CollectionListComponent from '@/views/collection/collection-list/CollectionList.vue'
import { RouteConfig } from 'vue-router'

export const collectionRoutes: Array<RouteConfig> = [
    {
        path: '/collection',
        name: 'collection-list',
        component: CollectionListComponent,
        props: (route: any) => ({ archived: route.query.archived === 'true' }),
    },
    {
        path: '/collection/:id',
        component: CollectionDetailComponent,
        props: (route: any) => ({ collectionId: parseInt(route.params.id) }),
        children: [
            {
                path: '',
                name: 'collection-detail',
                component: CollectionDescription,
            },
            {
                path: 'settings',
                name: 'collection-detail-settings',
                component: CollectionSettings,
            },
        ],
    },
]

import CollectionCompletedTasks from '@/views/collection/collection-detail/tabs/CollectionCompletedTasks.vue'
import CollectionConfiguration from '@/views/collection/collection-detail/tabs/CollectionConfiguration.vue'
import CollectionDescription from '@/views/collection/collection-detail/tabs/CollectionDescription.vue'
import CollectionList from '@/views/collection/collection-list/CollectionList.vue'
import CollectionDetail from '@/views/collection/collection-detail/CollectionDetail.vue'
import { RouteConfig } from 'vue-router'

export const collectionRoutes: Array<RouteConfig> = [
    {
        path: '/collection',
        name: 'collection-list',
        component: CollectionList,
    },
    {
        path: '/collection/:id',
        component: CollectionDetail,
        props: (route: any) => ({
            collectionId: parseInt(route.params.id),
        }),
        children: [
            {
                path: '',
                name: 'collection-detail',
                component: CollectionDescription,
            },
            {
                path: 'completed-tasks',
                name: 'collection-detail-completed-tasks',
                component: CollectionCompletedTasks,
            },
            {
                path: 'configuration',
                name: 'collection-detail-configuration',
                component: CollectionConfiguration,
            },
        ],
    },
]

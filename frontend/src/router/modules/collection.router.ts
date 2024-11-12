import CollectionDetailComponent from '@/views/collection/collection-detail/CollectionDetail.vue'
import CollectionSettings from '@/views/collection/collection-detail/tabs/CollectionSettings.vue'
import CollectionGeneral from '@/views/collection/collection-detail/tabs/CollectionGeneral.vue'
import CollectionListComponent from '@/views/collection/collection-list/CollectionList.vue'
import { RouteRecordRaw } from 'vue-router'

export const collectionRoutes: RouteRecordRaw[] = [
  {
    path: '/collection',
    name: 'collection-list',
    component: CollectionListComponent,
    props: route => ({ archived: route.query.archived === 'true' }),
  },
  {
    path: '/collection/:id',
    component: CollectionDetailComponent,
    props: route => ({ collectionId: parseInt(route.params.id) }),
    children: [
      {
        path: '',
        name: 'collection-detail',
        component: CollectionGeneral,
      },
      {
        path: 'settings',
        name: 'collection-detail-settings',
        component: CollectionSettings,
      },
    ],
  },
]

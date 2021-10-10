import CollectionList from "@/views/collection/collection-list/CollectionList.vue";
import CollectionDetail from "@/views/collection/collection-detail/CollectionDetail.vue";

export const collectionRoutes = [
    {
        path: '/collection',
        name: 'collection-list',
        component: CollectionList
    },
    {
        path: '/collection/:id',
        name: 'collection-detail',
        component: CollectionDetail,
        props: (route: any) => ({
            collectionId: parseInt(route.params.id)
        })
    }
]

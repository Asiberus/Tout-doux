import CollectionList from "@/views/collection/CollectionList.vue";
import CollectionDetail from "@/views/collection/CollectionDetail.vue";

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
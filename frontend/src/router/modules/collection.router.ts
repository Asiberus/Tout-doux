import CollectionList from "@/views/list/CollectionList.vue";
import CollectionDetail from "@/views/list/CollectionDetail.vue";

export const collectionRoute = [
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
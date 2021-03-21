import ProjectList from "@/views/project/ProjectList.vue";
import ProjectDetail from "@/views/project/ProjectDetail.vue";

export default [
    {
        path: '/project',
        name: 'project-list',
        component: ProjectList,
        props: (route: any) => ({
            archived: route.query.archived == 'true'
        })
    },
    {
        path: '/project/:id',
        name: 'project-detail',
        component: ProjectDetail,
        props: (route: any) => ({
            projectId: route.params.id
        })
    }
]

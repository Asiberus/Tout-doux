import ProjectList from "@/views/project/project-list/ProjectList.vue";
import ProjectDetail from "@/views/project/project-detail/ProjectDetail.vue";

export const projectRoutes = [
    {
        path: '/project',
        name: 'project-list',
        component: ProjectList,
        props: (route: any) => ({
            archived: route.query.archived === 'true'
        })
    },
    {
        path: '/project/:id',
        name: 'project-detail',
        component: ProjectDetail,
        props: (route: any) => ({
            projectId: parseInt(route.params.id)
        })
    }
]

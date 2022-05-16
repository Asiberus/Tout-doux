import ProjectCompletedTasks from '@/views/project/project-detail/tabs/ProjectCompletedTasks.vue'
import ProjectConfiguration from '@/views/project/project-detail/tabs/ProjectConfiguration.vue'
import ProjectDescription from '@/views/project/project-detail/tabs/ProjectDescription.vue'
import ProjectSection from '@/views/project/project-detail/tabs/ProjectSection.vue'
import ProjectList from '@/views/project/project-list/ProjectList.vue'
import ProjectDetail from '@/views/project/project-detail/ProjectDetail.vue'
import ProjectEvent from '@/views/project/project-detail/tabs/ProjectEvent.vue'
import { RouteConfig } from 'vue-router'

export const projectRoutes: Array<RouteConfig> = [
    {
        path: '/project',
        name: 'project-list',
        component: ProjectList,
        props: (route: any) => ({
            archived: route.query.archived === 'true',
        }),
    },
    {
        path: '/project/:id',
        component: ProjectDetail,
        props: (route: any) => ({
            projectId: parseInt(route.params.id),
        }),
        children: [
            {
                path: '',
                name: 'project-detail',
                component: ProjectDescription,
            },
            {
                path: 'section',
                name: 'project-detail-section',
                component: ProjectSection,
            },
            {
                path: 'event',
                name: 'project-detail-event',
                component: ProjectEvent,
            },
            {
                path: 'completed-tasks',
                name: 'project-detail-completed-tasks',
                component: ProjectCompletedTasks,
            },
            {
                path: 'configuration',
                name: 'project-detail-configuration',
                component: ProjectConfiguration,
            },
        ],
    },
]

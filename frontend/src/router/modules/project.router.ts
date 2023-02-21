import ProjectDetailComponent from '@/views/project/project-detail/ProjectDetail.vue'
import ProjectConfiguration from '@/views/project/project-detail/tabs/ProjectConfiguration.vue'
import ProjectDescription from '@/views/project/project-detail/tabs/ProjectDescription.vue'
import ProjectEvent from '@/views/project/project-detail/tabs/ProjectEvent.vue'
import ProjectSection from '@/views/project/project-detail/tabs/ProjectSection.vue'
import ProjectListComponent from '@/views/project/project-list/ProjectList.vue'
import { RouteConfig } from 'vue-router'

export const projectRoutes: Array<RouteConfig> = [
    {
        path: '/project',
        name: 'project-list',
        component: ProjectListComponent,
        props: (route: any) => ({ archived: route.query.archived === 'true' }),
    },
    {
        path: '/project/:id',
        component: ProjectDetailComponent,
        props: (route: any) => ({ projectId: parseInt(route.params.id) }),
        children: [
            {
                path: '',
                name: 'project-detail',
                component: ProjectDescription,
            },
            {
                path: 'section/:sectionId?',
                name: 'project-detail-section',
                component: ProjectSection,
                props: (route: any) => ({ sectionId: parseInt(route.params.sectionId) }),
            },
            {
                path: 'event',
                name: 'project-detail-event',
                component: ProjectEvent,
            },
            {
                path: 'configuration',
                name: 'project-detail-configuration',
                component: ProjectConfiguration,
            },
        ],
    },
]

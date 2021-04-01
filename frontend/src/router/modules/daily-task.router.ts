import DailyTaskOverview from "@/views/daily-task/DailyTaskOverview.vue";
import DailyTaskCreate from "@/views/daily-task/DailyTaskCreate.vue";

export const dailyTaskRoutes = [
    {
        path: '/daily-task',
        name: 'daily-task-overview',
        component: DailyTaskOverview
    },
    {
        path: '/daily-task/:date/update',
        name: 'daily-task-update',
        component: DailyTaskCreate,
        props: (route: any) => ({
            date: route.params.date
        })
    }
]
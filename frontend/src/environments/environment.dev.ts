export const BASE_URL = 'http://localhost:8000/api/'

export const version = '0.1.0'

export const apiRoutes = {
    project: 'project/',
    projectById: 'project/:projectId/',
    projectSections: 'project/:projectId/sections/',
    section: 'section/',
    sectionById: 'section/:sectionId/',
    task: 'task/',
    taskById: 'task/:taskId/',
    collection: 'collection/',
    collectionById: 'collection/:collectionId/',
    dailyTask: 'daily-task/',
    dailyTaskSummary: 'daily-task/summary/',
    dailyTaskById: 'daily-task/:dailyTaskId/',
}

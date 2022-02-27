import { apiRoutes } from '@/environment'
import Vue from 'vue'
import { Project } from '@/models/project.model'

const getProjectList = (params = {}) => {
    return Vue.http.get(apiRoutes.project, { params: { size: 0, ...params } })
}

const getProjectById = (projectId: number) => {
    return Vue.http.get(apiRoutes.projectById.replace(':projectId', projectId.toString()))
}

const createProject = (project: Partial<Project>) => {
    return Vue.http.post(apiRoutes.project, project)
}

const updateProject = (projectId: number, project: Partial<Project>) => {
    return Vue.http.patch(
        apiRoutes.projectById.replace(':projectId', projectId.toString()),
        project
    )
}

const deleteProject = (projectId: number) => {
    return Vue.http.delete(apiRoutes.projectById.replace(':projectId', projectId.toString()))
}

export const projectService = {
    getProjectList,
    getProjectById,
    createProject,
    updateProject,
    deleteProject,
}

import { apiRoutes } from '@/api-routes'
import Vue from 'vue'
import { Project, ProjectPostOrPatch } from '@/models/project.model'

const getProjectList = (params = {}) => {
    return Vue.http.get(apiRoutes.project, { params: { size: 0, ...params } })
}

const getProjectListDetailed = (params = {}) => {
    return Vue.http.get(apiRoutes.projectDetailed, { params: { size: 0, ...params } })
}

const getProjectById = (projectId: number) => {
    return Vue.http.get(apiRoutes.projectById.replace(':projectId', projectId.toString()))
}

const createProject = (project: ProjectPostOrPatch) => {
    return Vue.http.post(apiRoutes.project, project)
}

const updateProject = (projectId: number, project: ProjectPostOrPatch) => {
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
    getProjectListDetailed,
    getProjectById,
    createProject,
    updateProject,
    deleteProject,
}

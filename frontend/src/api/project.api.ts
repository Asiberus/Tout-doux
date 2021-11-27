import { environment } from '@/environments/environment.dev'
import Vue from 'vue'
import { Project } from '@/models/project.model'

const getProjectList = (params = {}) => {
    return Vue.http.get(environment.project, { params })
}

const getProjectById = (projectId: number) => {
    return Vue.http.get(environment.projectById.replace(':projectId', projectId.toString()))
}

// TODO : remove if unused
const getProjectSections = (projectId: number) => {
    const url = environment.projectSections.replace(':projectId', projectId.toString())
    return Vue.http.get(url)
}

const createProject = (project: Partial<Project>) => {
    return Vue.http.post(environment.project, project)
}

const updateProject = (projectId: number, project: Partial<Project>) => {
    return Vue.http.patch(
        environment.projectById.replace(':projectId', projectId.toString()),
        project
    )
}

const deleteProject = (projectId: number) => {
    return Vue.http.delete(environment.projectById.replace(':projectId', projectId.toString()))
}

export const projectService = {
    getProjectList,
    getProjectById,
    getProjectSections,
    createProject,
    updateProject,
    deleteProject,
}

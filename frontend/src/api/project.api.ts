import { apiRoutes } from '@/api-routes'
import { ProjectPostOrPatch } from '@/models/project.model'
import axiosInstance from '@/axios/axios-instance'

export function getProjectList(params = {}) {
  return axiosInstance.get(apiRoutes.project, { params: { size: 0, ...params } })
}

export function getProjectListDetailed(params = {}) {
  return axiosInstance.get(apiRoutes.projectDetailed, { params: { size: 0, ...params } })
}

export function getProjectById(projectId: number) {
  return axiosInstance.get(apiRoutes.projectById.replace(':projectId', projectId.toString()))
}

export function createProject(project: ProjectPostOrPatch) {
  return axiosInstance.post(apiRoutes.project, project)
}

export function updateProject(projectId: number, project: ProjectPostOrPatch) {
  return axiosInstance.patch(
    apiRoutes.projectById.replace(':projectId', projectId.toString()),
    project
  )
}

export function deleteProject(projectId: number) {
  return axiosInstance.delete(apiRoutes.projectById.replace(':projectId', projectId.toString()))
}

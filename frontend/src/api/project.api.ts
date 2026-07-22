import { apiRoutes } from '@/api-routes'
import { Project, ProjectDetail, ProjectList, ProjectPostOrPatch } from '@/models/project.model'
import { Pagination } from '@/models/pagination.model'
import { http } from '@/axios/http'

export function getProjectList(params = {}): Promise<Pagination<ProjectList[]>> {
  return http.get<Pagination<ProjectList[]>>(apiRoutes.project, { params: { size: 0, ...params } })
}

export function getProjectListDetailed(params = {}): Promise<Pagination<ProjectDetail[]>> {
  return http.get<Pagination<ProjectDetail[]>>(apiRoutes.projectDetailed, {
    params: { size: 0, ...params },
  })
}

export function getProjectById(projectId: number): Promise<ProjectDetail> {
  return http.get<ProjectDetail>(apiRoutes.projectById.replace(':projectId', projectId.toString()))
}

export function createProject(project: ProjectPostOrPatch): Promise<Project> {
  return http.post<Project>(apiRoutes.project, project)
}

export function updateProject(projectId: number, project: ProjectPostOrPatch): Promise<Project> {
  return http.patch<Project>(
    apiRoutes.projectById.replace(':projectId', projectId.toString()),
    project
  )
}

export function deleteProject(projectId: number): Promise<void> {
  return http.delete(apiRoutes.projectById.replace(':projectId', projectId.toString()))
}

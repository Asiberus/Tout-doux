import { apiRoutes } from '@/api-routes'
import { SectionPatch, SectionPost } from '@/models/section.model'
import axiosInstance from '@/axios/axios-instance'

export function createSection(section: SectionPost) {
  return axiosInstance.post(apiRoutes.section, section)
}

export function updateSection(id: number, section: SectionPatch) {
  const url = apiRoutes.sectionById.replace(':sectionId', id.toString())
  return axiosInstance.patch(url, section)
}

export function deleteSection(id: number) {
  const url = apiRoutes.sectionById.replace(':sectionId', id.toString())
  return axiosInstance.delete(url)
}

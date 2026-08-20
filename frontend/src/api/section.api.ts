import { apiRoutes } from '@/api-routes'
import { SectionPatch, SectionPost, SectionTask } from '@/models/section.model'
import { http } from '@/axios/http'

export function createSection(section: SectionPost): Promise<SectionTask> {
  return http.post<SectionTask>(apiRoutes.section, section)
}

export function updateSection(id: number, section: SectionPatch): Promise<SectionTask> {
  const url = apiRoutes.sectionById.replace(':sectionId', id.toString())
  return http.patch<SectionTask>(url, section)
}

export function deleteSection(id: number): Promise<void> {
  const url = apiRoutes.sectionById.replace(':sectionId', id.toString())
  return http.delete(url)
}

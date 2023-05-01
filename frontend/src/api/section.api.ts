import { apiRoutes } from '@/api-routes'
import { SectionPatch, SectionPost } from '@/models/section.model'
import Vue from 'vue'

const createSection = (section: SectionPost) => {
    return Vue.http.post(apiRoutes.section, section)
}

const updateSection = (id: number, section: SectionPatch) => {
    const url = apiRoutes.sectionById.replace(':sectionId', id.toString())
    return Vue.http.patch(url, section)
}

const deleteSection = (id: number) => {
    const url = apiRoutes.sectionById.replace(':sectionId', id.toString())
    return Vue.http.delete(url)
}

export const sectionService = {
    createSection,
    updateSection,
    deleteSection,
}

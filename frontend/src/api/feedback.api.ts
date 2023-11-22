import Vue from 'vue'
import { FeedbackPost } from '@/models/feedback.model'
import { apiRoutes } from '@/api-routes'
import { PaginationParams } from '@/models/common.model'

export function getFeedback(params: PaginationParams = {}) {
    return Vue.http.get(apiRoutes.feedback, { params })
}

export function createFeedback(data: FeedbackPost) {
    return Vue.http.post(apiRoutes.feedback, data)
}

export function setFeedbackReadProperty(id: number, value: boolean) {
    return Vue.http.patch(apiRoutes.feedbackById.replace(':id', id.toString()), { isRead: value })
}

export function deleteFeedback(id: number) {
    return Vue.http.delete(apiRoutes.feedbackById.replace(':id', id.toString()))
}

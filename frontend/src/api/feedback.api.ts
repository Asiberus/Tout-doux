import Vue from 'vue'
import { FeedbackPost } from '@/models/feedback.model'
import { apiRoutes } from '@/api-routes'

export function createFeedback(data: FeedbackPost) {
    return Vue.http.post(apiRoutes.feedback, data)
}

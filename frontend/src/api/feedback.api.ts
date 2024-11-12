import { FeedbackPost } from '@/models/feedback.model'
import { apiRoutes } from '@/api-routes'
import { PaginationParams } from '@/models/common.model'
import axiosInstance from '@/axios/axios-instance'

export function getFeedback(params: PaginationParams = {}) {
  return axiosInstance.get(apiRoutes.feedback, { params })
}

export function createFeedback(data: FeedbackPost) {
  return axiosInstance.post(apiRoutes.feedback, data)
}

export function setFeedbackReadProperty(id: number, value: boolean) {
  return axiosInstance.patch(apiRoutes.feedbackById.replace(':id', id.toString()), {
    isRead: value,
  })
}

export function deleteFeedback(id: number) {
  return axiosInstance.delete(apiRoutes.feedbackById.replace(':id', id.toString()))
}

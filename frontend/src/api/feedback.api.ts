import { FeedbackPost } from '@/models/feedback.model'
import { apiRoutes } from '@/api-routes'
import { PaginationParams } from '@/models/pagination.model'
import axiosInstance from '@/axios/axios-instance'

export function getFeedback(params: PaginationParams = {}) {
  return axiosInstance.get(apiRoutes.feedback, { params }).then(response => response.data)
}

export function createFeedback(data: FeedbackPost) {
  return axiosInstance.post(apiRoutes.feedback, data).then(response => response.data)
}

export function setFeedbackReadProperty(id: number, value: boolean) {
  return axiosInstance
    .patch(apiRoutes.feedbackById.replace(':id', id.toString()), {
      isRead: value,
    })
    .then(response => response.data)
}

export function deleteFeedback(id: number) {
  return axiosInstance
    .delete(apiRoutes.feedbackById.replace(':id', id.toString()))
    .then(response => response.data)
}

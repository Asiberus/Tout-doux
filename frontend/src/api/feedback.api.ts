import { Feedback, FeedbackPost } from '@/models/feedback.model'
import { apiRoutes } from '@/api-routes'
import { Pagination, PaginationParams } from '@/models/pagination.model'
import { http } from '@/axios/http'

export function getFeedback(params: PaginationParams = {}): Promise<Pagination<Feedback[]>> {
  return http.get<Pagination<Feedback[]>>(apiRoutes.feedback, { params })
}

export function createFeedback(data: FeedbackPost): Promise<Feedback> {
  return http.post<Feedback>(apiRoutes.feedback, data)
}

export function setFeedbackReadProperty(id: number, value: boolean): Promise<Feedback> {
  return http.patch<Feedback>(apiRoutes.feedbackById.replace(':id', id.toString()), {
    isRead: value,
  })
}

export function deleteFeedback(id: number): Promise<void> {
  return http.delete(apiRoutes.feedbackById.replace(':id', id.toString()))
}

import { User } from '@/models/user.model'

export interface Feedback {
    id: number
    title: string
    message: string
    user: User
    date: string
    isRead: boolean
}

export interface FeedbackPost {
    title: string
    message: string
}

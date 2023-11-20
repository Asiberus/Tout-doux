import { User } from '@/models/user.model'
import { ProjectDetail } from '@/models/project.model'
import { CollectionDetail } from '@/models/collection.model'
import { Preferences } from '@/models/preferences.model'

export interface StoreInterface {
    user: {
        user: User | undefined
    }
    project: {
        currentProject: ProjectDetail | undefined
    }
    collection: {
        currentCollection: CollectionDetail | undefined
    }
    preferences: {
        preferences: Preferences | undefined
    }
}

import { userApi } from '@/api'
import { User, UserPatch } from '@/models/user.model'
import { defineStore } from 'pinia'

interface UserStoreState {
  user?: User
}

interface UserStoreGetters extends Record<string, (state: UserStoreState) => unknown> {
  loadedUser(state: UserStoreState): User
}

interface UserStoreActions {
  getUser(): Promise<void>
  updateUser(data: UserPatch): Promise<void>
  removeUser(): void
}

export const useUserStore = defineStore<'user', UserStoreState, UserStoreGetters, UserStoreActions>(
  'user',
  {
    state: (): UserStoreState => ({
      user: undefined,
    }),
    getters: {
      loadedUser(state): User {
        if (!state.user) throw new Error('user accessed before being loaded')
        return state.user
      },
    },
    actions: {
      async getUser(): Promise<void> {
        await userApi
          .getUserConnected()
          .then(response => (this.user = response))
          .catch(error => console.error(error))
      },

      async updateUser(data: UserPatch): Promise<void> {
        await userApi
          .updateUserConnected(data)
          .then(response => (this.user = { ...this.user, ...response }))
          .catch(error => console.error(error))
      },

      removeUser(): void {
        this.user = undefined
      },
    },
  }
)

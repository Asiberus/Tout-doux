import { userApi } from '@/api'
import { User, UserPatch } from '@/models/user.model'
import { defineStore } from 'pinia'

interface UserStoreState {
  user?: User
}

interface UserStoreActions {
  getUser(): Promise<void>
  updateUser(data: UserPatch): Promise<void>
  removeUser(): void
}

export const useUserStore = defineStore<'user', UserStoreState, {}, UserStoreActions>('user', {
  state: (): UserStoreState => ({
    user: undefined,
  }),
  actions: {
    async getUser(): Promise<void> {
      await userApi
        .getUserConnected()
        .then((response: any) => (this.user = response))
        .catch((error: any) => console.error(error))
    },

    async updateUser(data: UserPatch): Promise<void> {
      await userApi
        .updateUserConnected(data)
        .then((response: any) => {
          this.user = { ...this.user, response }
        })
        .catch((error: any) => console.error(error))
    },

    removeUser(): void {
      this.user = undefined
    },
  },
})

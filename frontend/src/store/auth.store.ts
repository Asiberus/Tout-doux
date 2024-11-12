import { defineStore } from 'pinia'
import { LoginPost } from '@/models/login.model'
import { authApi } from '@/api'
import { useAppStore } from '@/store/app.store'
import { getToken } from '@/services/auth.service'

interface AuthStoreGetters extends Record<string, () => any> {
  isAuthenticated(): boolean
  getToken(): string | null
}

interface AuthStoreActions {
  login(data: LoginPost)
  logout(): Promise<void>
  setToken(token: string): void
  removeToken(): void
  resetStore(): void
}

const TOKEN_KEY = 'td_token'

export const useAuthStore = defineStore<'auth', {}, AuthStoreGetters, AuthStoreActions>('auth', {
  getters: {
    isAuthenticated(): boolean {
      const token = getToken()
      return token !== null
    },

    getToken(): string | null {
      return localStorage.getItem(TOKEN_KEY)
    },
  },
  actions: {
    login(data: LoginPost) {
      return authApi.login(data).then((response: any) => {
        const token = response.token
        this.setToken(token)

        return response
      })
    },

    logout(): Promise<void> {
      return authApi
        .logout()
        .then(() => this.removeToken())
        .then(() => this.resetStore())
    },

    setToken(token: string): void {
      localStorage.setItem(TOKEN_KEY, token)
    },

    removeToken(): void {
      localStorage.removeItem(TOKEN_KEY)
    },

    resetStore(): void {
      const appStore = useAppStore()
      appStore.exit()
    },
  },
})

import { defineStore } from 'pinia'
import { LoginPost, LoginResponse } from '@/models/login.model'
import { authApi } from '@/api'
import { useAppStore } from '@/store/app.store'
import { getToken } from '@/services/auth.service'

interface AuthStoreGetters extends Record<string, () => unknown> {
  isAuthenticated(): boolean
  getToken(): string | null
}

interface AuthStoreActions {
  login(data: LoginPost): Promise<LoginResponse>
  logout(): Promise<void>
  setToken(token: string): void
  removeToken(): void
  resetStore(): void
}

const TOKEN_KEY = 'td_token'

// TODO: Not used ? see if needed
export const useAuthStore = defineStore<
  'auth',
  Record<string, never>,
  AuthStoreGetters,
  AuthStoreActions
>('auth', {
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
    async login(data: LoginPost) {
      const response = await authApi.login(data)
      const token = response.token
      this.setToken(token)
      return response
    },

    async logout(): Promise<void> {
      await authApi.logout()
      this.removeToken()
      return this.resetStore()
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

import { authApi } from '@/api'
import { LoginPost } from '@/models/login.model'
import { useAppStore } from '@/store'

const TOKEN_KEY = 'td_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export function resetStore(): void {
  const appStore = useAppStore()
  appStore.exit()
}

export function login(data: LoginPost) {
  return authApi.login(data).then(response => {
    const token = response.token
    setToken(token)

    return response
  })
}

export function logout(): Promise<void> {
  return authApi
    .logout()
    .then(() => removeToken())
    .then(() => resetStore())
}

export function isAuthenticated(): boolean {
  const token = getToken()
  return token !== null
}

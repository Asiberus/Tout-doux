import { authApi } from '@/api'
import { LoginPost } from '@/models/login.model'
import Vue from 'vue'

const TOKEN_KEY = 'td_token'

export function login(data: LoginPost) {
    return authApi.login(data).then((response: any) => {
        const token = response.body.token
        setToken(token)

        return response
    })
}

export function logout() {
    return authApi
        .logout()
        .then(() => removeToken())
        .then(() => resetStore())
}

export function isAuthenticated(): boolean {
    const token = getToken()
    return token !== null
}

export function getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token)
}

export function removeToken(): void {
    localStorage.removeItem(TOKEN_KEY)
}

export async function resetStore(): Promise<any> {
    return Vue.store.dispatch('exit')
}

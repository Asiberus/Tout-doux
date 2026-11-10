import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { routerPush, authService } = vi.hoisted(() => ({
  routerPush: vi.fn(),
  authService: {
    isAuthenticated: vi.fn(),
    getToken: vi.fn(),
    removeToken: vi.fn(),
    resetStore: vi.fn(),
  },
}))

// `axios-instance` importe `@/router`, qui importe les vues en dur : sans ce mock, un test de la
// couche HTTP monterait toute l'application.
vi.mock('@/router', () => ({ default: { push: routerPush } }))
vi.mock('@/services', () => ({ authService }))

import axiosInstance from '@/axios/axios-instance'
import { http } from '@/axios/http'

const adapter = vi.fn()

function resolveWith(data: unknown): void {
  adapter.mockImplementationOnce(async config => ({
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config,
  }))
}

function rejectWith(status: number): void {
  adapter.mockRejectedValueOnce(Object.assign(new Error('échec'), { response: { status } }))
}

describe('http', () => {
  beforeEach(() => {
    axiosInstance.defaults.adapter = adapter
    authService.isAuthenticated.mockReturnValue(false)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('résout directement le corps de la réponse, sans l’enveloppe axios', async () => {
    resolveWith({ id: 1 })

    await expect(http.get('project/')).resolves.toEqual({ id: 1 })
  })

  it('associe chaque méthode au verbe HTTP correspondant', async () => {
    resolveWith(null)
    await http.get('project/')
    resolveWith(null)
    await http.post('project/', { name: 'X' })
    resolveWith(null)
    await http.patch('project/1/', { name: 'Y' })
    resolveWith(null)
    await http.delete('project/1/')

    expect(adapter.mock.calls.map(([config]) => config.method)).toEqual([
      'get',
      'post',
      'patch',
      'delete',
    ])
  })

  it('transmet le corps de la requête tel quel', async () => {
    resolveWith(null)
    await http.post('project/', { name: 'X' })

    expect(JSON.parse(adapter.mock.calls[0][0].data)).toEqual({ name: 'X' })
  })
})

describe('intercepteur de requête', () => {
  beforeEach(() => {
    axiosInstance.defaults.adapter = adapter
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('pose le jeton en Bearer quand l’utilisateur est authentifié', async () => {
    authService.isAuthenticated.mockReturnValue(true)
    authService.getToken.mockReturnValue('abc123')
    resolveWith(null)

    await http.get('project/')

    expect(adapter.mock.calls[0][0].headers.Authorization).toBe('Bearer abc123')
  })

  it('n’ajoute aucun en-tête d’autorisation sinon', async () => {
    authService.isAuthenticated.mockReturnValue(false)
    resolveWith(null)

    await http.get('project/')

    expect(adapter.mock.calls[0][0].headers.Authorization).toBeUndefined()
  })
})

describe('intercepteur de réponse', () => {
  beforeEach(() => {
    axiosInstance.defaults.adapter = adapter
    authService.isAuthenticated.mockReturnValue(false)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('purge la session et redirige vers la connexion sur un 401', async () => {
    rejectWith(401)

    await expect(http.get('project/')).rejects.toThrow()

    expect(authService.removeToken).toHaveBeenCalledOnce()
    expect(authService.resetStore).toHaveBeenCalledOnce()
    expect(routerPush).toHaveBeenCalledWith({ name: 'login' })
  })

  it('laisse passer les autres erreurs sans toucher à la session', async () => {
    rejectWith(500)

    await expect(http.get('project/')).rejects.toThrow()

    expect(authService.removeToken).not.toHaveBeenCalled()
    expect(routerPush).not.toHaveBeenCalled()
  })
})

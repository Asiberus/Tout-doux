import { onScopeDispose } from 'vue'

export function useRequestScope(): { signal: () => AbortSignal; renew: () => void } {
  let controller = new AbortController()
  onScopeDispose(() => controller.abort())

  return {
    signal: (): AbortSignal => controller.signal,
    renew(): void {
      controller.abort()
      controller = new AbortController()
    },
  }
}

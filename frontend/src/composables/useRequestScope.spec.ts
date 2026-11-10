import { effectScope } from 'vue'
import { describe, expect, it } from 'vitest'
import { useRequestScope } from '@/composables/useRequestScope'

describe('useRequestScope', () => {
  it('annule le signal précédent au renouvellement', () => {
    const requests = effectScope().run(() => useRequestScope())!
    const previous = requests.signal()
    requests.renew()
    expect(previous.aborted).toBe(true)
    expect(requests.signal().aborted).toBe(false)
  })

  it('annule le signal courant à la destruction du scope', () => {
    const scope = effectScope()
    const requests = scope.run(() => useRequestScope())!
    scope.stop()
    expect(requests.signal().aborted).toBe(true)
  })
})

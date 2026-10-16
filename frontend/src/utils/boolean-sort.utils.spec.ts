import { describe, expect, it } from 'vitest'
import { booleanSort } from '@/utils/boolean-sort.utils'

describe('booleanSort', () => {
  it('place true avant false', () => {
    expect(booleanSort(true, false)).toBe(-1)
  })

  it('place false après true', () => {
    expect(booleanSort(false, true)).toBe(1)
  })

  it('laisse deux valeurs identiques inchangées', () => {
    expect(booleanSort(true, true)).toBe(0)
    expect(booleanSort(false, false)).toBe(0)
  })
})

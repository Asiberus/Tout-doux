import { describe, expect, it } from 'vitest'
import { dateFormat } from '@/pipes/date.pipe'

describe('dateFormat', () => {
  it('applique le format demandé', () => {
    expect(dateFormat('2026-03-10T14:30:00', 'DD/MM/YYYY')).toBe('10/03/2026')
    expect(dateFormat('2026-03-10T14:30:00', 'HH:mm')).toBe('14:30')
  })

  it('renvoie « Invalid date » sur une entrée non parsable', () => {
    expect(dateFormat('pas une date', 'DD/MM/YYYY')).toBe('Invalid date')
  })
})

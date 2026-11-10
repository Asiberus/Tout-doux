import { afterEach, describe, expect, it } from 'vitest'
import { hideScroll, showScroll } from '@/utils/document.utils'

describe('hideScroll / showScroll', () => {
  afterEach(() => {
    document.documentElement.className = ''
  })

  it('pose les deux classes sur la racine du document', () => {
    hideScroll()

    expect(document.documentElement.classList.contains('hide-scroll')).toBe(true)
    expect(document.documentElement.classList.contains('overscroll-behavior-none')).toBe(true)
  })

  it('retire les deux classes', () => {
    hideScroll()
    showScroll()

    expect(document.documentElement.classList.contains('hide-scroll')).toBe(false)
    expect(document.documentElement.classList.contains('overscroll-behavior-none')).toBe(false)
  })
})

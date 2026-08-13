import { describe, expect, it } from 'vitest'

import { parseRupiahInput } from './format'

describe('parseRupiahInput', () => {
  it.each([
    ['1 jt', 1_000_000],
    ['1 juta', 1_000_000],
    ['1,5 jt', 1_500_000],
    ['2.5 juta', 2_500_000],
    ['500 rb', 500_000],
    ['Rp 750 ribu', 750_000],
    ['25k', 25_000],
    ['1.500.000', 1_500_000],
  ])('mengubah %s menjadi rupiah yang benar', (input, expected) => {
    expect(parseRupiahInput(input)).toBe(expected)
  })
})

import { describe, expect, it } from 'vitest'
import { LANGUAGES, STRINGS } from './strings'

describe('UI strings', () => {
  it('has the same keys in every language', () => {
    const keys = Object.keys(STRINGS.en).sort()
    for (const lang of LANGUAGES) expect(Object.keys(STRINGS[lang]).sort()).toEqual(keys)
  })

  it('has no empty strings', () => {
    for (const lang of LANGUAGES) {
      for (const [key, value] of Object.entries(STRINGS[lang])) expect(value.trim(), `${lang}:${key}`).not.toBe('')
    }
  })

  it('keeps the same {placeholders} in both languages', () => {
    const marks = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort()
    for (const [key, value] of Object.entries(STRINGS.en)) {
      expect(marks(STRINGS.zh[key as keyof typeof STRINGS.zh]), key).toEqual(marks(value))
    }
  })
})

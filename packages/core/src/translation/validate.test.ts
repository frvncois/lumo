/**
 * Translation Validation Tests
 */

import { describe, it, expect } from 'vitest'
import {
  validateDefaultLanguageExists,
  validateTranslationContent,
  validatePageTranslations,
  validatePostTranslations,
  isLanguageConfigured,
} from './validate.js'
import type { PageTranslations, PostTranslations } from '../types.js'

describe('validateDefaultLanguageExists', () => {
  it('should pass when default language exists', () => {
    const translations = {
      en: { slug: 'home', title: 'Home', fields: {}, updatedAt: '2024-01-01' },
    }

    const result = validateDefaultLanguageExists(translations, 'en')
    expect(result.success).toBe(true)
  })

  it('should fail when default language missing', () => {
    const translations = {
      fr: { slug: 'accueil', title: 'Accueil', fields: {}, updatedAt: '2024-01-01' },
    }

    const result = validateDefaultLanguageExists(translations, 'en')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.errors[0].reason).toContain('DEFAULT_LANGUAGE_MISSING')
    }
  })

  it('should include content type in error message', () => {
    const translations = {}

    const result = validateDefaultLanguageExists(translations, 'en', 'post')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.errors[0].message).toContain('post')
    }
  })
})

describe('validateTranslationContent', () => {
  it('should validate valid translation content', () => {
    const content = {
      slug: 'my-page',
      title: 'My Page',
      fields: { hero: 'Welcome' },
      updatedAt: '2024-01-01T00:00:00Z',
    }

    const result = validateTranslationContent(content, 'en')
    expect(result.success).toBe(true)
  })

  it('should reject non-object content', () => {
    const result = validateTranslationContent(null, 'en')
    expect(result.success).toBe(false)
  })

  it('should reject missing slug', () => {
    const content = {
      title: 'My Page',
      fields: {},
      updatedAt: '2024-01-01',
    }

    const result = validateTranslationContent(content, 'en')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.errors.some((e) => e.path.includes('slug'))).toBe(true)
    }
  })

  it('should reject non-string slug', () => {
    const content = {
      slug: 123,
      title: 'My Page',
      fields: {},
      updatedAt: '2024-01-01',
    }

    const result = validateTranslationContent(content, 'en')
    expect(result.success).toBe(false)
  })

  it('should reject missing title', () => {
    const content = {
      slug: 'my-page',
      fields: {},
      updatedAt: '2024-01-01',
    }

    const result = validateTranslationContent(content, 'en')
    expect(result.success).toBe(false)
  })

  it('should reject non-string title', () => {
    const content = {
      slug: 'my-page',
      title: 123,
      fields: {},
      updatedAt: '2024-01-01',
    }

    const result = validateTranslationContent(content, 'en')
    expect(result.success).toBe(false)
  })

  it('should reject missing fields', () => {
    const content = {
      slug: 'my-page',
      title: 'My Page',
      updatedAt: '2024-01-01',
    }

    const result = validateTranslationContent(content, 'en')
    expect(result.success).toBe(false)
  })

  it('should reject non-object fields', () => {
    const content = {
      slug: 'my-page',
      title: 'My Page',
      fields: 'invalid',
      updatedAt: '2024-01-01',
    }

    const result = validateTranslationContent(content, 'en')
    expect(result.success).toBe(false)
  })

  it('should reject missing updatedAt', () => {
    const content = {
      slug: 'my-page',
      title: 'My Page',
      fields: {},
    }

    const result = validateTranslationContent(content, 'en')
    expect(result.success).toBe(false)
  })

  it('should include language in error path', () => {
    const content = {
      title: 'My Page',
      fields: {},
      updatedAt: '2024-01-01',
    }

    const result = validateTranslationContent(content, 'fr')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.errors[0].path).toContain('fr')
    }
  })
})

describe('validatePageTranslations', () => {
  it('should validate valid page translations', () => {
    const translations: PageTranslations = {
      en: {
        slug: 'home',
        title: 'Home',
        fields: {},
        updatedAt: '2024-01-01',
      },
    }

    const result = validatePageTranslations(translations, 'en', ['en', 'fr'])
    expect(result.success).toBe(true)
  })

  it('should validate multiple translations', () => {
    const translations: PageTranslations = {
      en: {
        slug: 'home',
        title: 'Home',
        fields: {},
        updatedAt: '2024-01-01',
      },
      fr: {
        slug: 'accueil',
        title: 'Accueil',
        fields: {},
        updatedAt: '2024-01-01',
      },
    }

    const result = validatePageTranslations(translations, 'en', ['en', 'fr'])
    expect(result.success).toBe(true)
  })

  it('should reject missing default language', () => {
    const translations: PageTranslations = {
      fr: {
        slug: 'accueil',
        title: 'Accueil',
        fields: {},
        updatedAt: '2024-01-01',
      },
    }

    const result = validatePageTranslations(translations, 'en', ['en', 'fr'])
    expect(result.success).toBe(false)
  })

  it('should reject unconfigured language', () => {
    const translations: PageTranslations = {
      en: {
        slug: 'home',
        title: 'Home',
        fields: {},
        updatedAt: '2024-01-01',
      },
      es: {
        slug: 'inicio',
        title: 'Inicio',
        fields: {},
        updatedAt: '2024-01-01',
      },
    }

    const result = validatePageTranslations(translations, 'en', ['en', 'fr'])
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.errors.some((e) => e.message.includes('es'))).toBe(true)
    }
  })

  it('should reject non-object translations', () => {
    const result = validatePageTranslations(null as any, 'en', ['en'])
    expect(result.success).toBe(false)
  })

  it('should reject invalid translation content', () => {
    const translations: any = {
      en: {
        // Missing required fields
        slug: 'home',
      },
    }

    const result = validatePageTranslations(translations, 'en', ['en'])
    expect(result.success).toBe(false)
  })
})

describe('validatePostTranslations', () => {
  it('should validate valid post translations', () => {
    const translations: PostTranslations = {
      en: {
        slug: 'my-post',
        title: 'My Post',
        fields: {},
        updatedAt: '2024-01-01',
      },
    }

    const result = validatePostTranslations(translations, 'en', ['en', 'fr'])
    expect(result.success).toBe(true)
  })

  it('should validate multiple translations', () => {
    const translations: PostTranslations = {
      en: {
        slug: 'my-post',
        title: 'My Post',
        fields: {},
        updatedAt: '2024-01-01',
      },
      fr: {
        slug: 'mon-article',
        title: 'Mon Article',
        fields: {},
        updatedAt: '2024-01-01',
      },
    }

    const result = validatePostTranslations(translations, 'en', ['en', 'fr'])
    expect(result.success).toBe(true)
  })

  it('should reject missing default language', () => {
    const translations: PostTranslations = {
      fr: {
        slug: 'mon-article',
        title: 'Mon Article',
        fields: {},
        updatedAt: '2024-01-01',
      },
    }

    const result = validatePostTranslations(translations, 'en', ['en', 'fr'])
    expect(result.success).toBe(false)
  })

  it('should reject unconfigured language', () => {
    const translations: PostTranslations = {
      en: {
        slug: 'my-post',
        title: 'My Post',
        fields: {},
        updatedAt: '2024-01-01',
      },
      de: {
        slug: 'mein-beitrag',
        title: 'Mein Beitrag',
        fields: {},
        updatedAt: '2024-01-01',
      },
    }

    const result = validatePostTranslations(translations, 'en', ['en', 'fr'])
    expect(result.success).toBe(false)
  })
})

describe('isLanguageConfigured', () => {
  it('should return true for configured language', () => {
    const result = isLanguageConfigured('en', ['en', 'fr'])
    expect(result).toBe(true)
  })

  it('should return false for unconfigured language', () => {
    const result = isLanguageConfigured('es', ['en', 'fr'])
    expect(result).toBe(false)
  })

  it('should handle empty languages array', () => {
    const result = isLanguageConfigured('en', [])
    expect(result).toBe(false)
  })

  it('should be case-sensitive', () => {
    const result = isLanguageConfigured('EN', ['en', 'fr'])
    expect(result).toBe(false)
  })
})

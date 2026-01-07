/**
 * Page Validation Tests
 */

import { describe, it, expect } from 'vitest'
import { validatePageTranslation, validatePageTranslations } from './page.js'
import type { LumoConfig, TranslationContent, PageTranslations } from '../types.js'

const mockConfig: LumoConfig = {
  languages: ['en', 'fr'],
  defaultLanguage: 'en',
  pages: {
    home: {
      fields: [
        { key: 'hero_title', type: 'text', label: 'Hero Title', required: true },
        { key: 'hero_image', type: 'image', label: 'Hero Image', required: false },
      ],
    },
  },
  postTypes: {},
  media: {
    maxImageSize: 10 * 1024 * 1024,
    maxVideoSize: 100 * 1024 * 1024,
    maxAudioSize: 50 * 1024 * 1024,
    maxDocumentSize: 20 * 1024 * 1024,
  },
}

describe('validatePageTranslation', () => {
  it('should validate valid page translation', () => {
    const content: TranslationContent = {
      slug: 'home',
      title: 'Home Page',
      fields: {
        hero_title: 'Welcome',
        hero_image: { mediaId: 'media_123', alt: 'Hero' },
      },
      updatedAt: new Date().toISOString(),
    }

    const result = validatePageTranslation('home', 'en', content, mockConfig)
    expect(result.success).toBe(true)
  })

  it('should reject unconfigured language', () => {
    const content: TranslationContent = {
      slug: 'home',
      title: 'Home Page',
      fields: {
        hero_title: 'Welcome',
      },
      updatedAt: new Date().toISOString(),
    }

    const result = validatePageTranslation('home', 'es', content, mockConfig)
    expect(result.success).toBe(false)
  })

  it('should reject undefined page', () => {
    const content: TranslationContent = {
      slug: 'undefined-page',
      title: 'Undefined',
      fields: {},
      updatedAt: new Date().toISOString(),
    }

    const result = validatePageTranslation('undefined-page', 'en', content, mockConfig)
    expect(result.success).toBe(false)
  })

  it('should reject invalid slug', () => {
    const content: TranslationContent = {
      slug: 'Invalid Slug',
      title: 'Home Page',
      fields: {
        hero_title: 'Welcome',
      },
      updatedAt: new Date().toISOString(),
    }

    const result = validatePageTranslation('home', 'en', content, mockConfig)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.errors.some((e) => e.path === 'slug')).toBe(true)
    }
  })

  it('should reject invalid title', () => {
    const content: TranslationContent = {
      slug: 'home',
      title: '',
      fields: {
        hero_title: 'Welcome',
      },
      updatedAt: new Date().toISOString(),
    }

    const result = validatePageTranslation('home', 'en', content, mockConfig)
    expect(result.success).toBe(false)
  })

  it('should reject missing required field', () => {
    const content: TranslationContent = {
      slug: 'home',
      title: 'Home',
      fields: {
        // Missing required hero_title
      },
      updatedAt: new Date().toISOString(),
    }

    const result = validatePageTranslation('home', 'en', content, mockConfig)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.errors.some((e) => e.path === 'fields.hero_title')).toBe(true)
    }
  })

  it('should accept optional fields missing', () => {
    const content: TranslationContent = {
      slug: 'home',
      title: 'Home',
      fields: {
        hero_title: 'Welcome',
        // hero_image is optional
      },
      updatedAt: new Date().toISOString(),
    }

    const result = validatePageTranslation('home', 'en', content, mockConfig)
    expect(result.success).toBe(true)
  })

  it('should validate with correct MediaReference', () => {
    const content: TranslationContent = {
      slug: 'home',
      title: 'Home',
      fields: {
        hero_title: 'Welcome',
        hero_image: { mediaId: 'media_123', alt: 'Hero image' },
      },
      updatedAt: new Date().toISOString(),
    }

    const result = validatePageTranslation('home', 'en', content, mockConfig)
    expect(result.success).toBe(true)
  })

  it('should reject invalid MediaReference', () => {
    const content: TranslationContent = {
      slug: 'home',
      title: 'Home',
      fields: {
        hero_title: 'Welcome',
        hero_image: { mediaId: '', alt: 'Hero' }, // Empty mediaId
      },
      updatedAt: new Date().toISOString(),
    }

    const result = validatePageTranslation('home', 'en', content, mockConfig)
    expect(result.success).toBe(false)
  })
})

describe('validatePageTranslations', () => {
  it('should validate translations with default language', () => {
    const translations: PageTranslations = {
      en: {
        slug: 'home',
        title: 'Home',
        fields: {},
        updatedAt: new Date().toISOString(),
      },
    }

    const result = validatePageTranslations(translations, mockConfig)
    expect(result.success).toBe(true)
  })

  it('should validate translations with multiple languages', () => {
    const translations: PageTranslations = {
      en: {
        slug: 'home',
        title: 'Home',
        fields: {},
        updatedAt: new Date().toISOString(),
      },
      fr: {
        slug: 'accueil',
        title: 'Accueil',
        fields: {},
        updatedAt: new Date().toISOString(),
      },
    }

    const result = validatePageTranslations(translations, mockConfig)
    expect(result.success).toBe(true)
  })

  it('should reject missing default language', () => {
    const translations: PageTranslations = {
      fr: {
        slug: 'accueil',
        title: 'Accueil',
        fields: {},
        updatedAt: new Date().toISOString(),
      },
    }

    const result = validatePageTranslations(translations, mockConfig)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.errors[0].reason).toContain('DEFAULT_LANGUAGE_MISSING')
    }
  })

  it('should allow only default language', () => {
    const translations: PageTranslations = {
      en: {
        slug: 'home',
        title: 'Home',
        fields: {},
        updatedAt: new Date().toISOString(),
      },
    }

    const result = validatePageTranslations(translations, mockConfig)
    expect(result.success).toBe(true)
  })
})

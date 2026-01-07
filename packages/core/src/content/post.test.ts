/**
 * Post Validation Tests
 */

import { describe, it, expect } from 'vitest'
import {
  validatePostType,
  validatePostTranslation,
  validatePostTranslations,
  validatePostStatus,
} from './post.js'
import type { LumoConfig, TranslationContent, PostTranslations, PostStatus } from '../types.js'

const mockConfig: LumoConfig = {
  languages: ['en', 'fr'],
  defaultLanguage: 'en',
  pages: {},
  postTypes: {
    blog: {
      name: 'Blog Posts',
      nameSingular: 'Blog Post',
      fields: [
        { key: 'excerpt', type: 'textarea', label: 'Excerpt', required: true },
        { key: 'body', type: 'richtext', label: 'Body', required: true },
        { key: 'featured_image', type: 'image', label: 'Featured Image', required: false },
      ],
    },
  },
  media: {
    maxImageSize: 10 * 1024 * 1024,
    maxVideoSize: 100 * 1024 * 1024,
    maxAudioSize: 50 * 1024 * 1024,
    maxDocumentSize: 20 * 1024 * 1024,
  },
}

describe('validatePostType', () => {
  it('should validate configured post type', () => {
    const result = validatePostType('blog', mockConfig)
    expect(result.success).toBe(true)
  })

  it('should reject undefined post type', () => {
    const result = validatePostType('undefined_type', mockConfig)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.errors[0].reason).toContain('INVALID_POST_TYPE')
    }
  })

  it('should reject empty post type', () => {
    const result = validatePostType('', mockConfig)
    expect(result.success).toBe(false)
  })

  it('should reject non-string post type', () => {
    const result = validatePostType(123 as any, mockConfig)
    expect(result.success).toBe(false)
  })
})

describe('validatePostTranslation', () => {
  it('should validate valid post translation', () => {
    const content: TranslationContent = {
      slug: 'my-first-post',
      title: 'My First Post',
      fields: {
        excerpt: 'This is a short excerpt',
        body: JSON.stringify({ type: 'doc', content: [] }),
      },
      updatedAt: new Date().toISOString(),
    }

    const result = validatePostTranslation('blog', 'en', content, mockConfig)
    expect(result.success).toBe(true)
  })

  it('should reject unconfigured language', () => {
    const content: TranslationContent = {
      slug: 'my-post',
      title: 'My Post',
      fields: {
        excerpt: 'Excerpt',
        body: JSON.stringify({ type: 'doc', content: [] }),
      },
      updatedAt: new Date().toISOString(),
    }

    const result = validatePostTranslation('blog', 'es', content, mockConfig)
    expect(result.success).toBe(false)
  })

  it('should reject undefined post type', () => {
    const content: TranslationContent = {
      slug: 'my-post',
      title: 'My Post',
      fields: {},
      updatedAt: new Date().toISOString(),
    }

    const result = validatePostTranslation('undefined', 'en', content, mockConfig)
    expect(result.success).toBe(false)
  })

  it('should reject invalid slug', () => {
    const content: TranslationContent = {
      slug: 'Invalid Slug',
      title: 'Post',
      fields: {
        excerpt: 'Excerpt',
        body: JSON.stringify({ type: 'doc', content: [] }),
      },
      updatedAt: new Date().toISOString(),
    }

    const result = validatePostTranslation('blog', 'en', content, mockConfig)
    expect(result.success).toBe(false)
  })

  it('should reject missing required fields', () => {
    const content: TranslationContent = {
      slug: 'my-post',
      title: 'My Post',
      fields: {
        // Missing required excerpt and body
      },
      updatedAt: new Date().toISOString(),
    }

    const result = validatePostTranslation('blog', 'en', content, mockConfig)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.errors.length).toBeGreaterThan(0)
    }
  })

  it('should accept optional fields missing', () => {
    const content: TranslationContent = {
      slug: 'my-post',
      title: 'My Post',
      fields: {
        excerpt: 'Short excerpt',
        body: JSON.stringify({ type: 'doc', content: [] }),
        // featured_image is optional
      },
      updatedAt: new Date().toISOString(),
    }

    const result = validatePostTranslation('blog', 'en', content, mockConfig)
    expect(result.success).toBe(true)
  })

  it('should validate with MediaReference', () => {
    const content: TranslationContent = {
      slug: 'my-post',
      title: 'My Post',
      fields: {
        excerpt: 'Excerpt',
        body: JSON.stringify({ type: 'doc', content: [] }),
        featured_image: { mediaId: 'media_123', alt: 'Featured' },
      },
      updatedAt: new Date().toISOString(),
    }

    const result = validatePostTranslation('blog', 'en', content, mockConfig)
    expect(result.success).toBe(true)
  })
})

describe('validatePostTranslations', () => {
  it('should validate translations with default language', () => {
    const translations: PostTranslations = {
      en: {
        slug: 'my-post',
        title: 'My Post',
        fields: {},
        updatedAt: new Date().toISOString(),
      },
    }

    const result = validatePostTranslations(translations, mockConfig)
    expect(result.success).toBe(true)
  })

  it('should validate translations with multiple languages', () => {
    const translations: PostTranslations = {
      en: {
        slug: 'my-post',
        title: 'My Post',
        fields: {},
        updatedAt: new Date().toISOString(),
      },
      fr: {
        slug: 'mon-article',
        title: 'Mon Article',
        fields: {},
        updatedAt: new Date().toISOString(),
      },
    }

    const result = validatePostTranslations(translations, mockConfig)
    expect(result.success).toBe(true)
  })

  it('should reject missing default language', () => {
    const translations: PostTranslations = {
      fr: {
        slug: 'mon-article',
        title: 'Mon Article',
        fields: {},
        updatedAt: new Date().toISOString(),
      },
    }

    const result = validatePostTranslations(translations, mockConfig)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.errors[0].reason).toContain('DEFAULT_LANGUAGE_MISSING')
    }
  })
})

describe('validatePostStatus', () => {
  it('should validate draft status without publishedAt', () => {
    const result = validatePostStatus('draft', null)
    expect(result.success).toBe(true)
  })

  it('should validate draft status with publishedAt', () => {
    const result = validatePostStatus('draft', new Date().toISOString())
    expect(result.success).toBe(true)
  })

  it('should validate published status with publishedAt', () => {
    const result = validatePostStatus('published', new Date().toISOString())
    expect(result.success).toBe(true)
  })

  it('should reject published status without publishedAt', () => {
    const result = validatePostStatus('published', null)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.errors[0].reason).toContain('PUBLISHED_WITHOUT_DATE')
    }
  })

  it('should reject invalid status', () => {
    const result = validatePostStatus('invalid' as PostStatus, null)
    expect(result.success).toBe(false)
  })

  it('should reject empty string status', () => {
    const result = validatePostStatus('' as PostStatus, null)
    expect(result.success).toBe(false)
  })
})

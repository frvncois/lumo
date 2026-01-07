/**
 * Schema Validation Tests
 */

import { describe, it, expect } from 'vitest'
import { validateConfig, validatePageSchema, validatePostTypeSchema, validateFields } from './validate.js'
import type { LumoConfig, PageSchema, PostTypeSchema } from '../types.js'

describe('validateConfig', () => {
  it('should validate a valid configuration', () => {
    const config: LumoConfig = {
      languages: ['en', 'fr'],
      defaultLanguage: 'en',
      pages: {
        home: {
          fields: [
            { key: 'hero_title', type: 'text', label: 'Title', required: true },
          ],
        },
      },
      postTypes: {
        blog: {
          name: 'Blog Posts',
          nameSingular: 'Blog Post',
          fields: [
            { key: 'body', type: 'richtext', label: 'Body', required: true },
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

    expect(() => validateConfig(config)).not.toThrow()
  })

  it('should reject empty languages array', () => {
    const config: any = {
      languages: [],
      defaultLanguage: 'en',
      pages: {},
      postTypes: {},
      media: {
        maxImageSize: 10 * 1024 * 1024,
        maxVideoSize: 100 * 1024 * 1024,
        maxAudioSize: 50 * 1024 * 1024,
        maxDocumentSize: 20 * 1024 * 1024,
      },
    }

    expect(() => validateConfig(config)).toThrow('Invalid Lumo configuration')
  })

  it('should reject missing default language', () => {
    const config: any = {
      languages: ['en', 'fr'],
      defaultLanguage: '',
      pages: {},
      postTypes: {},
      media: {
        maxImageSize: 10 * 1024 * 1024,
        maxVideoSize: 100 * 1024 * 1024,
        maxAudioSize: 50 * 1024 * 1024,
        maxDocumentSize: 20 * 1024 * 1024,
      },
    }

    expect(() => validateConfig(config)).toThrow()
  })

  it('should reject default language not in languages array', () => {
    const config: any = {
      languages: ['en', 'fr'],
      defaultLanguage: 'es',
      pages: {},
      postTypes: {},
      media: {
        maxImageSize: 10 * 1024 * 1024,
        maxVideoSize: 100 * 1024 * 1024,
        maxAudioSize: 50 * 1024 * 1024,
        maxDocumentSize: 20 * 1024 * 1024,
      },
    }

    expect(() => validateConfig(config)).toThrow()
  })

  it('should reject invalid media size limits', () => {
    const config: any = {
      languages: ['en'],
      defaultLanguage: 'en',
      pages: {},
      postTypes: {},
      media: {
        maxImageSize: -1,
        maxVideoSize: 100 * 1024 * 1024,
        maxAudioSize: 50 * 1024 * 1024,
        maxDocumentSize: 20 * 1024 * 1024,
      },
    }

    expect(() => validateConfig(config)).toThrow()
  })
})

describe('validatePageSchema', () => {
  it('should validate a valid page schema', () => {
    const schema: PageSchema = {
      fields: [
        { key: 'hero_title', type: 'text', label: 'Hero Title', required: true },
        { key: 'hero_image', type: 'image', label: 'Hero Image', required: false },
      ],
    }

    const errors = validatePageSchema('home', schema)
    expect(errors).toEqual([])
  })

  it('should reject invalid field key format', () => {
    const schema: any = {
      fields: [
        { key: 'HeroTitle', type: 'text', label: 'Hero Title', required: true },
      ],
    }

    const errors = validatePageSchema('home', schema)
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0].path).toContain('fields[0].key')
    expect(errors[0].reason).toContain('pattern')
  })

  it('should reject reserved keys', () => {
    const schema: any = {
      fields: [
        { key: 'id', type: 'text', label: 'ID', required: true },
      ],
    }

    const errors = validatePageSchema('home', schema)
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0].reason).toContain('reserved')
  })

  it('should reject duplicate field keys', () => {
    const schema: any = {
      fields: [
        { key: 'title', type: 'text', label: 'Title 1', required: true },
        { key: 'title', type: 'text', label: 'Title 2', required: true },
      ],
    }

    const errors = validatePageSchema('home', schema)
    expect(errors.length).toBeGreaterThan(0)
    expect(errors.some((e) => e.reason.includes('Duplicate'))).toBe(true)
  })

  it('should reject field key longer than 32 characters', () => {
    const schema: any = {
      fields: [
        { key: 'this_is_a_very_long_field_key_that_exceeds_limit', type: 'text', label: 'Long', required: true },
      ],
    }

    const errors = validatePageSchema('home', schema)
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0].reason).toContain('32 characters')
  })

  it('should reject unknown field type', () => {
    const schema: any = {
      fields: [
        { key: 'custom', type: 'unknown_type', label: 'Custom', required: true },
      ],
    }

    const errors = validatePageSchema('home', schema)
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0].reason).toContain('Unknown field type')
  })

  it('should reject too many fields', () => {
    const fields = []
    for (let i = 0; i < 51; i++) {
      fields.push({ key: `field_${i}`, type: 'text', label: `Field ${i}`, required: false })
    }

    const schema: any = { fields }

    const errors = validatePageSchema('home', schema)
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0].reason).toContain('Maximum 50 fields')
  })
})

describe('validatePostTypeSchema', () => {
  it('should validate a valid post type schema', () => {
    const schema: PostTypeSchema = {
      name: 'Blog Posts',
      nameSingular: 'Blog Post',
      fields: [
        { key: 'excerpt', type: 'textarea', label: 'Excerpt', required: true },
        { key: 'body', type: 'richtext', label: 'Body', required: true },
      ],
    }

    const errors = validatePostTypeSchema('blog', schema)
    expect(errors).toEqual([])
  })

  it('should reject missing name', () => {
    const schema: any = {
      nameSingular: 'Blog Post',
      fields: [],
    }

    const errors = validatePostTypeSchema('blog', schema)
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0].path).toContain('name')
  })

  it('should reject missing nameSingular', () => {
    const schema: any = {
      name: 'Blog Posts',
      fields: [],
    }

    const errors = validatePostTypeSchema('blog', schema)
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0].path).toContain('nameSingular')
  })

  it('should validate all field types', () => {
    const schema: PostTypeSchema = {
      name: 'Test',
      nameSingular: 'Test',
      fields: [
        { key: 'text_field', type: 'text', label: 'Text', required: true },
        { key: 'textarea_field', type: 'textarea', label: 'Textarea', required: true },
        { key: 'richtext_field', type: 'richtext', label: 'RichText', required: true },
        { key: 'image_field', type: 'image', label: 'Image', required: false },
        { key: 'gallery_field', type: 'gallery', label: 'Gallery', required: false },
        { key: 'url_field', type: 'url', label: 'URL', required: false },
        { key: 'boolean_field', type: 'boolean', label: 'Boolean', required: false },
      ],
    }

    const errors = validatePostTypeSchema('test', schema)
    expect(errors).toEqual([])
  })
})

describe('validateFields', () => {
  it('should validate field key with underscores', () => {
    const schema: any = {
      fields: [
        { key: 'hero_title_text', type: 'text', label: 'Hero', required: true },
      ],
    }

    const errors = validatePageSchema('test', schema)
    expect(errors).toEqual([])
  })

  it('should validate field key starting with letter only', () => {
    const schema: any = {
      fields: [
        { key: '1_invalid', type: 'text', label: 'Invalid', required: true },
      ],
    }

    const errors = validatePageSchema('test', schema)
    expect(errors.length).toBeGreaterThan(0)
  })

  it('should validate field key with lowercase only', () => {
    const schema: any = {
      fields: [
        { key: 'Invalid_Case', type: 'text', label: 'Invalid', required: true },
      ],
    }

    const errors = validatePageSchema('test', schema)
    expect(errors.length).toBeGreaterThan(0)
  })

  it('should reject missing required flag', () => {
    const schema: any = {
      fields: [
        { key: 'test', type: 'text', label: 'Test' },
      ],
    }

    const errors = validatePageSchema('test', schema)
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0].reason).toContain('required must be a boolean')
  })
})

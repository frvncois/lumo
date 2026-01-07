/**
 * Content Validation Tests
 */

import { describe, it, expect } from 'vitest'
import { validateFields, validateSlug, validateTitle } from './validate.js'
import type { FieldDefinition, Fields } from '../types.js'

describe('validateFields', () => {
  it('should validate fields with all required fields present', () => {
    const schema: FieldDefinition[] = [
      { key: 'title', type: 'text', label: 'Title', required: true },
      { key: 'description', type: 'textarea', label: 'Description', required: true },
    ]

    const fields: Fields = {
      title: 'Hello World',
      description: 'This is a description',
    }

    const result = validateFields(fields, schema)
    expect(result.success).toBe(true)
  })

  it('should reject missing required fields', () => {
    const schema: FieldDefinition[] = [
      { key: 'title', type: 'text', label: 'Title', required: true },
    ]

    const fields: Fields = {}

    const result = validateFields(fields, schema)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.errors[0].path).toBe('fields.title')
      expect(result.errors[0].reason).toContain('REQUIRED')
    }
  })

  it('should accept missing optional fields', () => {
    const schema: FieldDefinition[] = [
      { key: 'title', type: 'text', label: 'Title', required: true },
      { key: 'subtitle', type: 'text', label: 'Subtitle', required: false },
    ]

    const fields: Fields = {
      title: 'Hello',
    }

    const result = validateFields(fields, schema)
    expect(result.success).toBe(true)
  })

  it('should ignore unknown fields', () => {
    const schema: FieldDefinition[] = [
      { key: 'title', type: 'text', label: 'Title', required: true },
    ]

    const fields: Fields = {
      title: 'Hello',
      unknown_field: 'This should be ignored',
    }

    const result = validateFields(fields, schema)
    expect(result.success).toBe(true)
  })

  it('should validate text field type', () => {
    const schema: FieldDefinition[] = [
      { key: 'name', type: 'text', label: 'Name', required: true },
    ]

    const fields: Fields = {
      name: 'John Doe',
    }

    const result = validateFields(fields, schema)
    expect(result.success).toBe(true)
  })

  it('should reject non-string text field', () => {
    const schema: FieldDefinition[] = [
      { key: 'name', type: 'text', label: 'Name', required: true },
    ]

    const fields: Fields = {
      name: 123 as any,
    }

    const result = validateFields(fields, schema)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.errors[0].reason).toContain('INVALID_FIELD_TYPE')
    }
  })

  it('should validate richtext field with valid JSON', () => {
    const schema: FieldDefinition[] = [
      { key: 'content', type: 'richtext', label: 'Content', required: true },
    ]

    const fields: Fields = {
      content: JSON.stringify({ type: 'doc', content: [] }),
    }

    const result = validateFields(fields, schema)
    expect(result.success).toBe(true)
  })

  it('should reject richtext field with invalid JSON', () => {
    const schema: FieldDefinition[] = [
      { key: 'content', type: 'richtext', label: 'Content', required: true },
    ]

    const fields: Fields = {
      content: 'not valid json{',
    }

    const result = validateFields(fields, schema)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.errors[0].reason).toContain('INVALID_RICHTEXT')
    }
  })

  it('should validate boolean field', () => {
    const schema: FieldDefinition[] = [
      { key: 'published', type: 'boolean', label: 'Published', required: true },
    ]

    const fields: Fields = {
      published: true,
    }

    const result = validateFields(fields, schema)
    expect(result.success).toBe(true)
  })

  it('should reject non-boolean value for boolean field', () => {
    const schema: FieldDefinition[] = [
      { key: 'published', type: 'boolean', label: 'Published', required: true },
    ]

    const fields: Fields = {
      published: 'yes' as any,
    }

    const result = validateFields(fields, schema)
    expect(result.success).toBe(false)
  })

  it('should validate URL field with http scheme', () => {
    const schema: FieldDefinition[] = [
      { key: 'website', type: 'url', label: 'Website', required: true },
    ]

    const fields: Fields = {
      website: 'https://example.com',
    }

    const result = validateFields(fields, schema)
    expect(result.success).toBe(true)
  })

  it('should validate URL field with mailto scheme', () => {
    const schema: FieldDefinition[] = [
      { key: 'email', type: 'url', label: 'Email', required: true },
    ]

    const fields: Fields = {
      email: 'mailto:test@example.com',
    }

    const result = validateFields(fields, schema)
    expect(result.success).toBe(true)
  })

  it('should validate URL field with tel scheme', () => {
    const schema: FieldDefinition[] = [
      { key: 'phone', type: 'url', label: 'Phone', required: true },
    ]

    const fields: Fields = {
      phone: 'tel:+1234567890',
    }

    const result = validateFields(fields, schema)
    expect(result.success).toBe(true)
  })

  it('should reject URL with invalid scheme', () => {
    const schema: FieldDefinition[] = [
      { key: 'link', type: 'url', label: 'Link', required: true },
    ]

    const fields: Fields = {
      link: 'ftp://example.com',
    }

    const result = validateFields(fields, schema)
    expect(result.success).toBe(false)
  })

  it('should reject malformed URL', () => {
    const schema: FieldDefinition[] = [
      { key: 'link', type: 'url', label: 'Link', required: true },
    ]

    const fields: Fields = {
      link: 'not a url',
    }

    const result = validateFields(fields, schema)
    expect(result.success).toBe(false)
  })

  it('should accept null for optional fields', () => {
    const schema: FieldDefinition[] = [
      { key: 'optional_text', type: 'text', label: 'Optional', required: false },
    ]

    const fields: Fields = {
      optional_text: null,
    }

    const result = validateFields(fields, schema)
    expect(result.success).toBe(true)
  })

  it('should reject empty string for required field', () => {
    const schema: FieldDefinition[] = [
      { key: 'title', type: 'text', label: 'Title', required: true },
    ]

    const fields: Fields = {
      title: '',
    }

    const result = validateFields(fields, schema)
    expect(result.success).toBe(false)
  })
})

describe('validateSlug', () => {
  it('should validate valid slug', () => {
    const result = validateSlug('hello-world')
    expect(result.success).toBe(true)
  })

  it('should validate slug with numbers', () => {
    const result = validateSlug('post-123')
    expect(result.success).toBe(true)
  })

  it('should reject slug with uppercase', () => {
    const result = validateSlug('Hello-World')
    expect(result.success).toBe(false)
  })

  it('should reject slug with spaces', () => {
    const result = validateSlug('hello world')
    expect(result.success).toBe(false)
  })

  it('should reject slug with special characters', () => {
    const result = validateSlug('hello_world')
    expect(result.success).toBe(false)
  })

  it('should reject empty slug', () => {
    const result = validateSlug('')
    expect(result.success).toBe(false)
  })

  it('should accept single character slug', () => {
    const result = validateSlug('a')
    expect(result.success).toBe(true)
  })
})

describe('validateTitle', () => {
  it('should validate valid title', () => {
    const result = validateTitle('Hello World')
    expect(result.success).toBe(true)
  })

  it('should validate title with special characters', () => {
    const result = validateTitle('Hello, World!')
    expect(result.success).toBe(true)
  })

  it('should reject empty title', () => {
    const result = validateTitle('')
    expect(result.success).toBe(false)
  })

  it('should reject whitespace-only title', () => {
    const result = validateTitle('   ')
    expect(result.success).toBe(false)
  })

  it('should reject non-string title', () => {
    const result = validateTitle(123 as any)
    expect(result.success).toBe(false)
  })
})

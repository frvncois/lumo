/**
 * Media Validation Tests
 */

import { describe, it, expect } from 'vitest'
import { validateMediaReference, validateMediaReferenceArray } from './media.js'
import type { MediaReference } from '../types.js'

describe('validateMediaReference', () => {
  it('should validate valid MediaReference', () => {
    const ref: MediaReference = {
      mediaId: 'media_123',
      alt: 'Photo of sunset',
    }

    const result = validateMediaReference(ref)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.mediaId).toBe('media_123')
      expect(result.data.alt).toBe('Photo of sunset')
    }
  })

  it('should validate MediaReference without alt text', () => {
    const ref: MediaReference = {
      mediaId: 'media_456',
    }

    const result = validateMediaReference(ref)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.mediaId).toBe('media_456')
      expect(result.data.alt).toBeUndefined()
    }
  })

  it('should validate MediaReference with null alt', () => {
    const ref = {
      mediaId: 'media_789',
      alt: null,
    }

    const result = validateMediaReference(ref)
    expect(result.success).toBe(true)
  })

  it('should reject null MediaReference', () => {
    const result = validateMediaReference(null)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.errors[0].reason).toContain('INVALID_MEDIA_REFERENCE')
    }
  })

  it('should reject array as MediaReference', () => {
    const result = validateMediaReference([])
    expect(result.success).toBe(false)
  })

  it('should reject primitive as MediaReference', () => {
    const result = validateMediaReference('media_123')
    expect(result.success).toBe(false)
  })

  it('should reject MediaReference without mediaId', () => {
    const ref = {
      alt: 'Photo',
    }

    const result = validateMediaReference(ref)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.errors[0].path).toContain('mediaId')
    }
  })

  it('should reject MediaReference with empty mediaId', () => {
    const ref = {
      mediaId: '',
      alt: 'Photo',
    }

    const result = validateMediaReference(ref)
    expect(result.success).toBe(false)
  })

  it('should reject MediaReference with whitespace-only mediaId', () => {
    const ref = {
      mediaId: '   ',
      alt: 'Photo',
    }

    const result = validateMediaReference(ref)
    expect(result.success).toBe(false)
  })

  it('should reject MediaReference with non-string mediaId', () => {
    const ref = {
      mediaId: 123,
      alt: 'Photo',
    }

    const result = validateMediaReference(ref)
    expect(result.success).toBe(false)
  })

  it('should reject MediaReference with non-string alt', () => {
    const ref = {
      mediaId: 'media_123',
      alt: 123,
    }

    const result = validateMediaReference(ref)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.errors[0].path).toContain('alt')
    }
  })

  it('should use custom field path in errors', () => {
    const ref = null

    const result = validateMediaReference(ref, 'fields.hero_image')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.errors[0].path).toBe('fields.hero_image')
    }
  })
})

describe('validateMediaReferenceArray', () => {
  it('should validate empty array', () => {
    const result = validateMediaReferenceArray([])
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual([])
    }
  })

  it('should validate array with valid MediaReferences', () => {
    const refs = [
      { mediaId: 'media_1', alt: 'Image 1' },
      { mediaId: 'media_2', alt: 'Image 2' },
      { mediaId: 'media_3' },
    ]

    const result = validateMediaReferenceArray(refs)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toHaveLength(3)
    }
  })

  it('should reject non-array input', () => {
    const result = validateMediaReferenceArray('not an array')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.errors[0].reason).toContain('INVALID_FIELD_TYPE')
    }
  })

  it('should reject array with invalid MediaReference', () => {
    const refs = [
      { mediaId: 'media_1', alt: 'Image 1' },
      { mediaId: '', alt: 'Invalid' }, // Invalid: empty mediaId
    ]

    const result = validateMediaReferenceArray(refs)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.errors[0].path).toContain('[1]')
    }
  })

  it('should collect all validation errors', () => {
    const refs = [
      { mediaId: '', alt: 'Invalid 1' },
      { alt: 'Invalid 2' }, // Missing mediaId
      { mediaId: 'media_3', alt: 123 }, // Invalid alt type
    ]

    const result = validateMediaReferenceArray(refs)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.errors.length).toBeGreaterThan(2)
    }
  })

  it('should use custom field path in errors', () => {
    const refs = [
      { mediaId: '' },
    ]

    const result = validateMediaReferenceArray(refs, 'fields.gallery')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.errors[0].path).toContain('fields.gallery')
    }
  })

  it('should validate mixed valid and undefined alt', () => {
    const refs = [
      { mediaId: 'media_1', alt: 'Image 1' },
      { mediaId: 'media_2' },
      { mediaId: 'media_3', alt: null },
    ]

    const result = validateMediaReferenceArray(refs)
    expect(result.success).toBe(true)
  })
})

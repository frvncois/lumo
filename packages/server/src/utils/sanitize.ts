/**
 * Content Sanitization Utilities
 *
 * Sanitizes richtext fields to prevent XSS attacks.
 * Applied in server routes on INPUT (admin save operations).
 */

import DOMPurify from 'isomorphic-dompurify'
import type { FieldDefinition, Fields } from '@lumo/core'

// Configuration for richtext - allow safe formatting only
const RICHTEXT_CONFIG = {
  ALLOWED_TAGS: [
    'p', 'br', 'b', 'i', 'u', 'strong', 'em',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'a', 'blockquote', 'code', 'pre'
  ],
  ALLOWED_ATTR: ['href', 'target', 'rel'],
  ALLOW_DATA_ATTR: false,
  FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form'],
  FORBID_ATTR: ['onerror', 'onclick', 'onload', 'onmouseover']
}

/**
 * Sanitize a string that may contain HTML.
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, RICHTEXT_CONFIG)
}

/**
 * Recursively sanitize richtext JSON content.
 * Handles TipTap/ProseMirror JSON structure.
 *
 * IMPORTANT: Only sanitizes known dangerous patterns:
 * - javascript: URLs in links
 * - HTML in text nodes (if present)
 * - Event handler attributes
 */
export function sanitizeRichtextJson(node: unknown): unknown {
  if (node === null || node === undefined) {
    return node
  }

  // Strings: Check if it looks like HTML (contains < and >)
  if (typeof node === 'string') {
    if (node.includes('<') && node.includes('>')) {
      return DOMPurify.sanitize(node, { ALLOWED_TAGS: [] })
    }
    return node
  }

  // Arrays: recurse
  if (Array.isArray(node)) {
    return node.map(sanitizeRichtextJson)
  }

  // Objects: check specific dangerous patterns
  if (typeof node === 'object') {
    const obj = node as Record<string, unknown>
    const result: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(obj)) {
      // Sanitize href attributes to prevent javascript: URLs
      if (key === 'href' && typeof value === 'string') {
        const href = value.toLowerCase().trim()
        if (href.startsWith('javascript:') || href.startsWith('data:')) {
          result[key] = '#'
          continue
        }
      }

      // Remove event handlers
      if (key.startsWith('on') && typeof value === 'string') {
        continue // Skip onclick, onerror, etc.
      }

      // Recurse into nested content
      if (key === 'content' || key === 'marks' || key === 'attrs') {
        result[key] = sanitizeRichtextJson(value)
      } else if (key === 'text' && typeof value === 'string') {
        // Text nodes - strip HTML if present
        result[key] = value.includes('<') ? DOMPurify.sanitize(value, { ALLOWED_TAGS: [] }) : value
      } else {
        result[key] = sanitizeRichtextJson(value)
      }
    }

    return result
  }

  return node
}

/**
 * Sanitize all richtext fields in a content object based on schema.
 */
export function sanitizeContentFields(
  content: Fields,
  fields: FieldDefinition[]
): Fields {
  const result = { ...content } as Fields

  for (const field of fields) {
    if (field.type === 'richtext' && field.key in content) {
      const value = content[field.key]

      if (typeof value === 'string') {
        try {
          // Parse JSON, sanitize, re-stringify
          const parsed = JSON.parse(value)
          const sanitized = sanitizeRichtextJson(parsed)
          result[field.key] = JSON.stringify(sanitized) as any
        } catch {
          // Not valid JSON - sanitize as HTML string
          result[field.key] = sanitizeHtml(value) as any
        }
      } else if (typeof value === 'object') {
        // Already parsed - sanitize directly
        result[field.key] = sanitizeRichtextJson(value) as any
      }
    }
  }

  return result
}

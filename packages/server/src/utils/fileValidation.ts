/**
 * File Upload Validation
 */

import type { MediaConfig } from '@lumo/core'

type MediaType = 'image' | 'video' | 'audio' | 'document'

/**
 * Determine media type from MIME type
 */
export function getMediaType(mimeType: string): MediaType {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType.startsWith('audio/')) return 'audio'
  return 'document'
}

/**
 * Get max file size for media type
 */
export function getMaxSize(type: MediaType, config: MediaConfig): number {
  const limits: Record<MediaType, number> = {
    image: config.maxImageSize,
    video: config.maxVideoSize,
    audio: config.maxAudioSize,
    document: config.maxDocumentSize,
  }
  return limits[type]
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export interface FileValidationResult {
  valid: boolean
  error?: string
}

// Allowlist of MIME types
const ALLOWED_MIME_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  video: ['video/mp4', 'video/webm', 'video/ogg'],
  audio: ['audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/webm'],
  document: ['application/pdf', 'text/plain'],
}

export function validateFileMimeType(mimeType: string, expectedType: string): FileValidationResult {
  const allowedTypes = ALLOWED_MIME_TYPES[expectedType as keyof typeof ALLOWED_MIME_TYPES]

  if (!allowedTypes) {
    return { valid: false, error: `Invalid file type: ${expectedType}` }
  }

  if (!allowedTypes.includes(mimeType)) {
    return {
      valid: false,
      error: `MIME type ${mimeType} not allowed for ${expectedType}. Allowed types: ${allowedTypes.join(', ')}`
    }
  }

  return { valid: true }
}

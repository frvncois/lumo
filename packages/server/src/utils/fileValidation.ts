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

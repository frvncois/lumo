/**
 * Media File Utilities
 */

import fs from 'node:fs'
import fsPromises from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { pipeline } from 'node:stream/promises'
import sharp from 'sharp'
import type { MultipartFile } from '@fastify/multipart'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Uploads directory path
export const UPLOADS_DIR = path.resolve(__dirname, '../../../..', 'uploads')

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  const ext = path.extname(filename).toLowerCase()
  return ext.startsWith('.') ? ext.slice(1) : ext
}

/**
 * Determine media type from MIME type
 */
export function getMediaType(mimeType: string): 'image' | 'video' | 'audio' | 'document' {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType.startsWith('audio/')) return 'audio'
  return 'document'
}

/**
 * Save uploaded file to disk
 */
export async function saveFile(file: MultipartFile, id: string): Promise<string> {
  const ext = getFileExtension(file.filename)
  const filename = `${id}.${ext}`
  const filepath = path.join(UPLOADS_DIR, filename)

  // Save file
  await pipeline(file.file, fs.createWriteStream(filepath))

  return filename
}

/**
 * Delete file from disk
 */
export async function deleteFile(filename: string): Promise<void> {
  const filepath = path.join(UPLOADS_DIR, filename)
  try {
    await fsPromises.unlink(filepath)
  } catch (err) {
    // Ignore if file doesn't exist
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw err
    }
  }
}

/**
 * Extract image metadata (width, height)
 */
export async function extractImageMetadata(filepath: string): Promise<{
  width: number | undefined
  height: number | undefined
}> {
  try {
    const metadata = await sharp(filepath).metadata()
    return {
      width: metadata.width,
      height: metadata.height,
    }
  } catch {
    return { width: undefined, height: undefined }
  }
}

/**
 * Extract video/audio duration using ffprobe if available
 */
export async function extractMediaDuration(filepath: string): Promise<number | undefined> {
  // TODO: Implement ffprobe integration
  // For now, return undefined
  return undefined
}

/**
 * Get full metadata for uploaded file
 */
export async function getFileMetadata(
  file: MultipartFile,
  filename: string
): Promise<{
  width: number | undefined
  height: number | undefined
  duration: number | undefined
}> {
  const filepath = path.join(UPLOADS_DIR, filename)
  const mediaType = getMediaType(file.mimetype)

  if (mediaType === 'image') {
    const { width, height } = await extractImageMetadata(filepath)
    return { width, height, duration: undefined }
  }

  if (mediaType === 'video' || mediaType === 'audio') {
    const duration = await extractMediaDuration(filepath)
    return { width: undefined, height: undefined, duration }
  }

  return { width: undefined, height: undefined, duration: undefined }
}

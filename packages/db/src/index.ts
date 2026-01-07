/**
 * @lumo/db
 *
 * LUMO Database Layer (V1)
 *
 * Provides SQLite database access and repository patterns for LUMO.
 */

// Connection
export { createDatabase, createInMemoryDatabase, closeDatabase } from './connection.js'
export type { DatabaseOptions } from './connection.js'

// Schema
export { initializeSchema, dropSchema } from './schema.js'

// Types
export type {
  PageRow,
  PageTranslationRow,
  PostRow,
  PostTranslationRow,
  MediaRow,
  PreviewRow,
  UserRow,
  CollaboratorRow,
} from './types.js'

// Pages Adapter
export {
  createPage,
  getPageById,
  getPageBySlug,
  listPages,
  upsertPageTranslation,
  deletePageTranslation,
  deletePage,
  isPageSlugAvailable,
} from './adapters/pages.js'

// Posts Adapter
export {
  createPost,
  getPostById,
  getPostBySlug,
  listPosts,
  listPublishedPosts,
  updatePost,
  upsertPostTranslation,
  deletePostTranslation,
  deletePost,
  isPostSlugAvailable,
} from './adapters/posts.js'
export type { CreatePostData, UpdatePostData, ListPostsOptions } from './adapters/posts.js'

// Media Adapter
export {
  createMedia,
  getMediaById,
  listMedia,
  replaceMedia,
  deleteMedia,
  getMediaReferences,
} from './adapters/media.js'
export type { CreateMediaData, ListMediaOptions } from './adapters/media.js'

// Previews Adapter
export {
  createPreview,
  getPreviewByToken,
  getPreviewById,
  deletePreview,
  deleteExpiredPreviews,
  listPreviewsByUser,
} from './adapters/previews.js'
export type { CreatePreviewData } from './adapters/previews.js'

// Users & Collaborators Adapter
export {
  createUser,
  getUserById,
  getUserByEmail,
  getUserWithRole,
  updatePassword,
  hasAnyUsers,
  deleteUser,
  listUsers,
  createCollaborator,
  getCollaboratorById,
  getCollaboratorByUserId,
  listCollaborators,
  updateCollaboratorRole,
  deleteCollaborator,
  countOwners,
  isUserOwner,
  isUserCollaborator,
  getOrCreateUser,
} from './adapters/users.js'
export type { UserWithRole } from './adapters/users.js'

// Schemas Adapter
export {
  createPageSchema,
  getPageSchema,
  getAllPageSchemas,
  updatePageSchema,
  deletePageSchema,
  createPostTypeSchema,
  getPostTypeSchema,
  getAllPostTypeSchemas,
  updatePostTypeSchema,
  deletePostTypeSchema,
} from './adapters/schemas.js'
export type {
  PageSchemaInput,
  PostTypeSchemaInput,
  PageSchemaWithMetadata,
  PostTypeSchemaWithMetadata,
} from './adapters/schemas.js'

// Settings Adapter
export {
  getSetting,
  setSetting,
  getAllSettings,
  deleteSetting,
} from './adapters/settings.js'
export type { SettingRow } from './adapters/settings.js'

// Field Migrations
export {
  detectFieldKeyChanges,
  migrateContentFieldKeys,
  migratePageTranslations,
  migratePostTranslations,
} from './adapters/field-migrations.js'

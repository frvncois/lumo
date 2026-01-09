/**
 * Fastify JSON Schema Definitions
 */

import type { FastifySchema } from 'fastify'

// Common schemas
const idParam = {
  type: 'object',
  required: ['id'],
  properties: {
    id: { type: 'string', minLength: 1 },
  },
} as const

const slugParam = {
  type: 'object',
  required: ['slug'],
  properties: {
    slug: { type: 'string', minLength: 1 },
  },
} as const

const langQuery = {
  type: 'object',
  properties: {
    lang: { type: 'string', pattern: '^[a-z]{2}(-[A-Z]{2})?$' },
  },
} as const

const translationContent = {
  type: 'object',
  required: ['slug', 'title', 'fields'],
  properties: {
    slug: { type: 'string', minLength: 1 },
    title: { type: 'string', minLength: 1 },
    fields: { type: 'object' },
  },
} as const

// Auth schemas
export const authSetupSchema: FastifySchema = {
  body: {
    type: 'object',
    required: ['projectName', 'email', 'password'],
    properties: {
      projectName: { type: 'string', minLength: 1, maxLength: 100 },
      email: { type: 'string', format: 'email' },
      password: { type: 'string', minLength: 8 },
    },
  },
}

export const authLoginSchema: FastifySchema = {
  body: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: { type: 'string' },
      password: { type: 'string' },
    },
  },
}

// Admin Pages schemas
export const adminListPagesSchema: FastifySchema = {}

export const adminGetPageByIdSchema: FastifySchema = {
  params: idParam,
}

export const adminCreatePageSchema: FastifySchema = {
  body: {
    type: 'object',
    required: ['translations'],
    properties: {
      translations: {
        type: 'object',
        additionalProperties: translationContent,
      },
    },
  },
}

export const adminUpsertPageTranslationSchema: FastifySchema = {
  params: {
    type: 'object',
    required: ['id', 'lang'],
    properties: {
      id: { type: 'string', minLength: 1 },
      lang: { type: 'string', pattern: '^[a-z]{2}(-[A-Z]{2})?$' },
    },
  },
  body: translationContent,
}

export const adminDeletePageTranslationSchema: FastifySchema = {
  params: {
    type: 'object',
    required: ['id', 'lang'],
    properties: {
      id: { type: 'string', minLength: 1 },
      lang: { type: 'string', pattern: '^[a-z]{2}(-[A-Z]{2})?$' },
    },
  },
}

export const adminDeletePageSchema: FastifySchema = {
  params: idParam,
}

// Admin Posts schemas
export const adminListPostsSchema: FastifySchema = {
  querystring: {
    type: 'object',
    required: ['type'],
    properties: {
      type: { type: 'string', minLength: 1 },
      status: { type: 'string', enum: ['all', 'draft', 'published'] },
      lang: { type: 'string', pattern: '^[a-z]{2}(-[A-Z]{2})?$' },
    },
  },
}

export const adminGetPostByIdSchema: FastifySchema = {
  params: idParam,
}

export const adminCreatePostSchema: FastifySchema = {
  body: {
    type: 'object',
    required: ['type'],
    properties: {
      type: { type: 'string', minLength: 1 },
      status: { type: 'string', enum: ['draft', 'published'] },
      publishedAt: { type: ['string', 'null'] },
      position: { type: ['number', 'null'] },
    },
  },
}

export const adminUpdatePostSchema: FastifySchema = {
  params: idParam,
  body: {
    type: 'object',
    properties: {
      status: { type: 'string', enum: ['draft', 'published'] },
      publishedAt: { type: ['string', 'null'] },
      position: { type: ['number', 'null'] },
    },
  },
}

export const adminUpsertPostTranslationSchema: FastifySchema = {
  params: {
    type: 'object',
    required: ['id', 'lang'],
    properties: {
      id: { type: 'string', minLength: 1 },
      lang: { type: 'string', pattern: '^[a-z]{2}(-[A-Z]{2})?$' },
    },
  },
  body: translationContent,
}

export const adminDeletePostTranslationSchema: FastifySchema = {
  params: {
    type: 'object',
    required: ['id', 'lang'],
    properties: {
      id: { type: 'string', minLength: 1 },
      lang: { type: 'string', pattern: '^[a-z]{2}(-[A-Z]{2})?$' },
    },
  },
}

export const adminDeletePostSchema: FastifySchema = {
  params: idParam,
}

// Admin Media schemas
export const adminListMediaSchema: FastifySchema = {
  querystring: {
    type: 'object',
    properties: {
      type: { type: 'string', enum: ['image', 'video', 'audio', 'document'] },
      limit: { type: 'number', minimum: 1, maximum: 100 },
    },
  },
}

export const adminReplaceMediaSchema: FastifySchema = {
  params: idParam,
}

export const adminDeleteMediaSchema: FastifySchema = {
  params: idParam,
}

// Admin Schema Management schemas
export const adminCreatePageSchemaSchema: FastifySchema = {
  body: {
    type: 'object',
    required: ['slug', 'fields'],
    properties: {
      slug: { type: 'string', minLength: 1 },
      fields: { type: 'array' },
    },
  },
}

export const adminUpdatePageSchemaSchema: FastifySchema = {
  params: slugParam,
  body: {
    type: 'object',
    properties: {
      name: { type: 'string', minLength: 1 },
      fields: { type: 'array' },
    },
  },
}

export const adminDeletePageSchemaSchema: FastifySchema = {
  params: slugParam,
}

export const adminCreatePostTypeSchemaSchema: FastifySchema = {
  body: {
    type: 'object',
    required: ['slug', 'name', 'nameSingular', 'fields'],
    properties: {
      slug: { type: 'string', minLength: 1 },
      name: { type: 'string', minLength: 1 },
      nameSingular: { type: 'string', minLength: 1 },
      fields: { type: 'array' },
    },
  },
}

export const adminUpdatePostTypeSchemaSchema: FastifySchema = {
  params: slugParam,
  body: {
    type: 'object',
    properties: {
      name: { type: 'string', minLength: 1 },
      nameSingular: { type: 'string', minLength: 1 },
      fields: { type: 'array' },
    },
  },
}

export const adminDeletePostTypeSchemaSchema: FastifySchema = {
  params: slugParam,
}

// Admin Settings schemas
export const adminUpdateLanguagesSchema: FastifySchema = {
  body: {
    type: 'object',
    required: ['languages', 'defaultLanguage'],
    properties: {
      languages: {
        type: 'array',
        items: { type: 'string', pattern: '^[a-z]{2}(-[A-Z]{2})?$' },
        minItems: 1,
      },
      defaultLanguage: { type: 'string', pattern: '^[a-z]{2}(-[A-Z]{2})?$' },
    },
  },
}

// Public Pages schemas
export const publicListPagesSchema: FastifySchema = {
  querystring: langQuery,
}

export const publicGetPageBySlugSchema: FastifySchema = {
  params: slugParam,
  querystring: langQuery,
}

// Public Posts schemas
export const publicListPostsSchema: FastifySchema = {
  querystring: {
    type: 'object',
    required: ['type'],
    properties: {
      type: { type: 'string', minLength: 1 },
      lang: { type: 'string', pattern: '^[a-z]{2}(-[A-Z]{2})?$' },
      limit: { type: 'string', pattern: '^[0-9]+$' },
      cursor: { type: 'string', pattern: '^[0-9]+$' },
      order: { type: 'string', enum: ['auto', 'date_desc', 'position_asc'] },
    },
  },
}

export const publicGetPostBySlugSchema: FastifySchema = {
  params: {
    type: 'object',
    required: ['type', 'slug'],
    properties: {
      type: { type: 'string', minLength: 1 },
      slug: { type: 'string', minLength: 1 },
    },
  },
  querystring: langQuery,
}

// Preview schemas
export const previewCreateSchema: FastifySchema = {
  body: {
    type: 'object',
    required: ['targetType', 'targetId', 'language', 'slug', 'title', 'fields'],
    properties: {
      targetType: { type: 'string', enum: ['page', 'post'] },
      targetId: { type: ['string', 'null'] },
      postType: { type: ['string', 'null'] },
      language: { type: 'string', pattern: '^[a-z]{2}(-[A-Z]{2})?$' },
      slug: { type: 'string', minLength: 1 },
      title: { type: 'string', minLength: 1 },
      fields: { type: 'object' },
    },
  },
}

export const previewGetByTokenSchema: FastifySchema = {
  params: {
    type: 'object',
    required: ['token'],
    properties: {
      token: { type: 'string', minLength: 1 },
    },
  },
}

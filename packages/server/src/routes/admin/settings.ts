/**
 * Admin Settings Routes
 */

import type { FastifyInstance } from 'fastify'
import { requireAuth } from '../../middleware/auth.js'
import { requireOwner } from '../../middleware/permissions.js'
import { getSetting, setSetting, getAllSettings } from '@lumo/db'
import { errors } from '../../utils/errors.js'
import { adminUpdateLanguagesSchema } from '../../schemas/index.js'
import type { GeneralSEO } from '@lumo/core'

export async function registerAdminSettingsRoutes(app: FastifyInstance) {
  /**
   * GET /api/admin/settings
   * Get all settings
   */
  app.get('/api/admin/settings', { preHandler: [requireAuth, requireOwner] }, async () => {
    const settings = getAllSettings(app.db)
    return settings
  })

  /**
   * PUT /api/admin/settings/languages
   * Update languages configuration
   */
  app.put<{
    Body: {
      languages: string[]
      defaultLanguage: string
    }
  }>('/api/admin/settings/languages', { preHandler: [requireAuth, requireOwner], schema: adminUpdateLanguagesSchema }, async (request, reply) => {
    const { languages, defaultLanguage } = request.body

    // Validation
    if (!Array.isArray(languages) || languages.length === 0) {
      return errors.validation(reply, 'At least one language is required')
    }

    if (!languages.includes(defaultLanguage)) {
      return errors.validation(reply, 'Default language must be in the languages list')
    }

    // Validate language codes (simple check for 2-letter codes)
    for (const lang of languages) {
      if (!/^[a-z]{2}(-[A-Z]{2})?$/.test(lang)) {
        return errors.validation(reply, `Invalid language code: ${lang}. Use ISO 639-1 codes (e.g., "en", "fr", "en-US")`)
      }
    }

    // Save to database
    setSetting(app.db, 'languages', languages)
    setSetting(app.db, 'defaultLanguage', defaultLanguage)

    // Reload config to reflect changes
    if (app.configLoader) {
      const newConfig = app.configLoader.reload()
      app.config = newConfig
      app.log.info('Configuration reloaded after language settings update')
    }

    return {
      success: true,
      languages,
      defaultLanguage,
    }
  })

  /**
   * GET /api/admin/settings/seo
   * Get general SEO settings
   */
  app.get('/api/admin/settings/seo', { preHandler: [requireAuth] }, async () => {
    const seo = getSetting<GeneralSEO>(app.db, 'generalSeo') || {}
    return seo
  })

  /**
   * PUT /api/admin/settings/seo
   * Update general SEO settings
   */
  app.put<{
    Body: GeneralSEO
  }>('/api/admin/settings/seo', { preHandler: [requireAuth, requireOwner] }, async (request) => {
    const seo = request.body
    setSetting(app.db, 'generalSeo', seo)
    return seo
  })
}

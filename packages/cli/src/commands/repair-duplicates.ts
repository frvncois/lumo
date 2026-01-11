/**
 * Repair Duplicate Slugs
 *
 * Finds and removes duplicate slugs before applying uniqueness constraints.
 */

import Database from 'better-sqlite3'
import { resolve } from 'path'

interface DuplicateRow {
  post_type: string | null
  language: string
  slug: string
  count: number
  ids: string
}

export async function repairDuplicates(options: {
  dbPath?: string
  dryRun?: boolean
  keepNewest?: boolean
}) {
  const dbPath = options.dbPath || resolve(process.cwd(), 'lumo.db')
  const dryRun = options.dryRun ?? true
  const keepNewest = options.keepNewest ?? true

  console.log(`Opening database: ${dbPath}`)
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes)' : 'LIVE (will modify data)'}`)
  console.log(`Strategy: Keep ${keepNewest ? 'newest' : 'oldest'} record\n`)

  const db = new Database(dbPath)

  // Find duplicate post slugs
  console.log('=== Checking post_translations ===')
  const postDupes = db.prepare(`
    SELECT
      NULL as post_type,
      language,
      slug,
      COUNT(*) as count,
      GROUP_CONCAT(post_id, ',') as ids
    FROM post_translations
    GROUP BY language, slug
    HAVING count > 1
  `).all() as DuplicateRow[]

  if (postDupes.length === 0) {
    console.log('No duplicate post slugs found.\n')
  } else {
    console.log(`Found ${postDupes.length} duplicate post slug groups:\n`)

    for (const dupe of postDupes) {
      console.log(`  Lang: ${dupe.language}, Slug: "${dupe.slug}"`)
      console.log(`  Count: ${dupe.count}, IDs: ${dupe.ids}`)

      const ids = dupe.ids.split(',')

      // Get full records to decide which to keep
      const records = db.prepare(`
        SELECT post_id, language, updated_at
        FROM post_translations
        WHERE post_id IN (${ids.map(() => '?').join(',')}) AND language = ? AND slug = ?
        ORDER BY updated_at ${keepNewest ? 'DESC' : 'ASC'}
      `).all(...ids, dupe.language, dupe.slug) as Array<{ post_id: string; language: string; updated_at: string }>

      const keepId = records[0].post_id
      const deleteIds = records.slice(1).map(r => r.post_id)

      console.log(`  Keep: ${keepId} (updated: ${records[0].updated_at})`)
      console.log(`  Delete: ${deleteIds.join(', ')}`)

      if (!dryRun) {
        for (const postId of deleteIds) {
          db.prepare(`DELETE FROM post_translations WHERE post_id = ? AND language = ?`)
            .run(postId, dupe.language)
        }
        console.log(`  ✓ Deleted ${deleteIds.length} duplicate(s)`)
      }
      console.log()
    }
  }

  // Find duplicate page slugs
  console.log('=== Checking page_translations ===')
  const pageDupes = db.prepare(`
    SELECT
      NULL as post_type,
      language,
      slug,
      COUNT(*) as count,
      GROUP_CONCAT(page_id, ',') as ids
    FROM page_translations
    GROUP BY language, slug
    HAVING count > 1
  `).all() as DuplicateRow[]

  if (pageDupes.length === 0) {
    console.log('No duplicate page slugs found.\n')
  } else {
    console.log(`Found ${pageDupes.length} duplicate page slug groups:\n`)

    for (const dupe of pageDupes) {
      console.log(`  Lang: ${dupe.language}, Slug: "${dupe.slug}"`)
      console.log(`  Count: ${dupe.count}, IDs: ${dupe.ids}`)

      const ids = dupe.ids.split(',')
      const records = db.prepare(`
        SELECT page_id, language, updated_at
        FROM page_translations
        WHERE page_id IN (${ids.map(() => '?').join(',')}) AND language = ? AND slug = ?
        ORDER BY updated_at ${keepNewest ? 'DESC' : 'ASC'}
      `).all(...ids, dupe.language, dupe.slug) as Array<{ page_id: string; language: string; updated_at: string }>

      const keepId = records[0].page_id
      const deleteIds = records.slice(1).map(r => r.page_id)

      console.log(`  Keep: ${keepId}`)
      console.log(`  Delete: ${deleteIds.join(', ')}`)

      if (!dryRun) {
        for (const pageId of deleteIds) {
          db.prepare(`DELETE FROM page_translations WHERE page_id = ? AND language = ?`)
            .run(pageId, dupe.language)
        }
        console.log(`  ✓ Deleted ${deleteIds.length} duplicate(s)`)
      }
      console.log()
    }
  }

  db.close()

  if (dryRun && (postDupes.length > 0 || pageDupes.length > 0)) {
    console.log('This was a DRY RUN. To apply changes, run with --live flag.')
  }

  console.log('Done.')
}

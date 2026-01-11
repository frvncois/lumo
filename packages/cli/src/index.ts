#!/usr/bin/env node

import { Command } from 'commander'
import { initCommand } from './commands/init.js'
import { devCommand } from './commands/dev.js'
import { addOwnerCommand } from './commands/add-owner.js'
import { repairDuplicates } from './commands/repair-duplicates.js'
import { backup } from './commands/backup.js'

const program = new Command()

program
  .name('lumo')
  .description('LUMO CMS CLI')
  .version('0.1.0')

program
  .command('init')
  .description('Initialize a new LUMO project with config and database')
  .action(initCommand)

program
  .command('dev')
  .description('Start server and admin in development mode')
  .action(devCommand)

program
  .command('add-owner')
  .description('Add a new owner user by email')
  .argument('<email>', 'Email address of the owner')
  .action(addOwnerCommand)

program
  .command('repair-duplicates')
  .description('Find and remove duplicate slugs before applying uniqueness constraints')
  .option('--db <path>', 'Path to database file', './lumo.db')
  .option('--live', 'Actually delete duplicates (default is dry-run)')
  .option('--keep-oldest', 'Keep oldest record instead of newest')
  .action(async (options) => {
    await repairDuplicates({
      dbPath: options.db,
      dryRun: !options.live,
      keepNewest: !options.keepOldest
    })
  })

program
  .command('backup')
  .description('Create a backup of the database')
  .option('--db <path>', 'Path to database file', './lumo.db')
  .option('--output <dir>', 'Output directory for backups', './backups')
  .option('--no-timestamp', 'Do not add timestamp to backup filename')
  .action(async (options) => {
    await backup({
      dbPath: options.db,
      outputDir: options.output,
      timestamp: options.timestamp !== false
    })
  })

program.parse()

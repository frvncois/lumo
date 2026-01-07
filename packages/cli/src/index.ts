#!/usr/bin/env node

import { Command } from 'commander'
import { initCommand } from './commands/init.js'
import { devCommand } from './commands/dev.js'
import { addOwnerCommand } from './commands/add-owner.js'

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

program.parse()

# LUMO CLI

Command-line interface for managing LUMO CMS projects.

## Installation

```bash
npm install -g @lumo/cli
```

Or use locally in a project:

```bash
npm install --save-dev @lumo/cli
npx lumo --help
```

## Commands

### `lumo init`

Initialize a new LUMO project with configuration and database.

```bash
lumo init
```

This command:
- Creates `lumo.config.ts` with example configuration
- Creates `lumo.db` with all required tables
- Sets up the database schema

**What it creates:**

- **lumo.config.ts**: Configuration file defining your content structure (pages, post types, media settings)
- **lumo.db**: SQLite database with all required tables (pages, posts, media, users, etc.)

**Interactive prompts:**
- Confirms before overwriting existing files
- Warns if database already exists (data loss)

**Example output:**
```
🚀 LUMO Project Initialization

✓ Created lumo.config.ts
✓ Created lumo.db with schema

✅ LUMO project initialized successfully!

Next steps:
  1. Edit lumo.config.ts to define your content structure
  2. Run: lumo add-owner <email> to add your first admin user
  3. Run: lumo dev to start the development server
```

### `lumo dev`

Start the LUMO server and admin UI in development mode.

```bash
lumo dev
```

This command:
- Starts the API server on `http://localhost:3000`
- Starts the admin UI on `http://localhost:5173`
- Watches for file changes and auto-reloads
- Passes config and database paths to the server

**Requirements:**
- `lumo.config.ts` must exist (run `lumo init` first)
- `lumo.db` must exist (run `lumo init` first)
- Both `@lumo/server` and `@lumo/admin` packages must be installed

**Environment variables set:**
- `LUMO_CONFIG_PATH`: Path to lumo.config.ts
- `LUMO_DB_PATH`: Path to lumo.db

**Example output:**
```
🚀 Starting LUMO in development mode...

📦 Starting API server on http://localhost:3000
📦 Starting admin UI on http://localhost:5173

✅ LUMO is running!
  API: http://localhost:3000
  Admin: http://localhost:5173/admin

Press Ctrl+C to stop
```

**Graceful shutdown:**
- Press `Ctrl+C` to stop both processes
- Automatically kills both server and admin when one exits

### `lumo add-owner <email>`

Add a new owner user by email address.

```bash
lumo add-owner admin@example.com
```

This command:
- Creates a new user with the specified email (if doesn't exist)
- Adds the user as an owner collaborator
- Validates the email format
- Handles existing users gracefully

**Arguments:**
- `<email>`: Email address of the owner (required)

**Requirements:**
- `lumo.db` must exist (run `lumo init` first)
- Email must be a valid email format

**Behavior:**
- If user doesn't exist: Creates user and adds as owner
- If user exists but not a collaborator: Adds as owner
- If user is already an editor: Upgrades to owner
- If user is already an owner: No changes, reports success

**Example output:**
```
👤 Adding LUMO Owner

✓ Created user: admin@example.com
✓ Added admin@example.com as owner

✅ Owner added successfully!

Next steps:
  1. Run: lumo dev to start the development server
  2. Go to http://localhost:5173/admin/login
  3. Sign in with: admin@example.com
```

## Usage Workflow

### 1. Initialize a new project

```bash
mkdir my-cms
cd my-cms
npm init -y
npm install @lumo/cli @lumo/server @lumo/admin @lumo/core @lumo/db
npx lumo init
```

### 2. Configure your content structure

Edit `lumo.config.ts` to define your pages, post types, and fields.

### 3. Add your first admin user

```bash
npx lumo add-owner your-email@example.com
```

### 4. Start development server

```bash
npx lumo dev
```

### 5. Access the admin panel

Open `http://localhost:5173/admin/login` and sign in with your email. Check the server logs for the magic link (in production, this would be sent via email).

## Development

### Build the CLI

```bash
npm run build
```

### Run locally during development

```bash
npm run dev
```

Then in another terminal:

```bash
node dist/index.js <command>
```

## Package Structure

```
packages/cli/
├── src/
│   ├── index.ts              # Main CLI entry point
│   └── commands/
│       ├── init.ts           # lumo init command
│       ├── dev.ts            # lumo dev command
│       └── add-owner.ts      # lumo add-owner command
├── dist/                     # Compiled JavaScript
├── package.json
├── tsconfig.json
└── README.md
```

## Dependencies

- **commander**: CLI argument parsing and command routing
- **prompts**: Interactive command-line prompts
- **chalk**: Terminal string styling and colors
- **better-sqlite3**: SQLite database access (peer dependency)

## Environment Variables

The CLI sets these environment variables when running `lumo dev`:

- `LUMO_CONFIG_PATH`: Absolute path to lumo.config.ts
- `LUMO_DB_PATH`: Absolute path to lumo.db

These are consumed by `@lumo/server` to locate the configuration and database.

## Error Handling

All commands include error handling:

- **File not found errors**: Clear messages about missing files
- **Database errors**: Reported with context
- **Validation errors**: Email validation, file overwrites
- **Exit codes**: Non-zero exit codes on failure

## Future Commands

Potential additions:

- `lumo build` - Build for production
- `lumo migrate` - Run database migrations
- `lumo seed` - Seed database with test data
- `lumo backup` - Backup database and media
- `lumo restore` - Restore from backup

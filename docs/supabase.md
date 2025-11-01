# Supabase Guide for BlockWarriors

This guide provides detailed instructions for working with Supabase in the BlockWarriors project.

## Prerequisites

- [Docker](https://www.docker.com/get-started) installed and running
- [Supabase CLI](https://supabase.com/docs/guides/cli) installed
- Basic understanding of PostgreSQL

## Initial Setup

1. **Login to Supabase**

   Run the following command to log in to your Supabase account:
   ```bash
   npx supabase login
   ```

2. **Initialize Your Supabase Project**

   If you haven't set up Supabase in this project yet, initialize it by running:
   ```bash
   npx supabase init
   ```

3. **Start the Supabase Local Server**

   Launch your local Supabase environment with:
   ```bash
   npx supabase start
   ```

   This command spins up a local PostgreSQL server along with emulators for Auth and Storage, mirroring the production setup for effective local development.

## Environment Variables Setup

Before starting your project, update your `.env` file with the following credentials for Google OAuth:

- `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID`: The client ID for the Google OAuth provider.
- `SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET`: The client secret for the Google OAuth provider.

After you have launched your Supabase instance, update your `.env` file with your project details:

- `NEXT_PUBLIC_SUPABASE_DATABASE_URL`: The URL of your Supabase project.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: The anonymous key for your Supabase project.

## Database Management Guide

This guide outlines essential Supabase commands for maintaining your database schema throughout the development lifecycle.

### Essential Commands for Schema Changes

| Command | Description | When to Use |
|---------|-------------|-------------|
| `npx supabase db diff` | Compares your local database against the reference schema and generates migration files | After making local schema changes |
| `npx supabase migration fetch` | Updates your local migration files from the remote database | Before starting work or making a PR |
| `npx supabase migration list` | Displays all migrations in your project | To verify migration status |
| `npx supabase db reset` | Resets your local database using existing migrations | When you need a clean database state |
| `npx supabase migration new my-migration-name` | Creates a new empty migration file that you can edit manually | When you want to write custom SQL migrations |

### Recommended Workflow

Follow this workflow to ensure smooth collaboration:

1. **Before Starting Work**

   ```bash
   # Fetch latest migrations from remote
   npx supabase migration fetch
   
   # Apply migrations to your local database
   npx supabase db reset
   ```

2. **After Making Schema Changes**

   ```bash
   # Generate migration file for your changes
   npx supabase db diff --file my-new-migration
   
   # Verify the new migration appears in the list
   npx supabase migration list
   ```

3. **Before Creating a Pull Request**

   ```bash
   # Fetch any new remote migrations
   npx supabase migration fetch
   
   # Apply all migrations (including yours) in sequence
   npx supabase db reset
   
   # Verify everything works correctly
   # (Test your application)
   ```

## Troubleshooting

- **Common Issues:**
  - If migrations fail, check for conflicting schema changes or syntax errors in your SQL
  - Ensure Docker is running before using Supabase commands
  - Verify port availability (default: 54322 for Postgres)

- For further assistance, refer to the official [Supabase Documentation](https://supabase.com/docs)

## Working with Authentication

The project uses Supabase Auth with Google OAuth. To set up authentication:

1. Create a Google OAuth application in the [Google Cloud Console](https://console.cloud.google.com/)
2. Add the client ID and secret to your environment variables
3. Configure the redirect URLs in your Supabase dashboard

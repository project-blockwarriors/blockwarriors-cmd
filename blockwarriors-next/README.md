# BlockWarriors Next

Welcome to BlockWarriors Next! This project leverages Supabase to manage our database both locally and remotely. Follow the instructions below to set up your local Supabase environment and ensure you’re synchronized with the remote database before submitting any Pull Requests.

## Prerequisites

- [Node.js](https://nodejs.org/) installed
- [Docker](https://www.docker.com/get-started) installed. Docker is required to run the Supabase local server. Make sure Docker Desktop (or its equivalent) is installed and running.
- [Supabase CLI](https://supabase.com/docs/guides/cli) installed
- A basic understanding of PostgreSQL (Supabase’s underlying database)
- **Important:** All Supabase commands listed in this README should be executed from the `blockwarriors-next` directory with the `npx` prefix.

## Setting Up the Supabase Local Server

1. **Install the Supabase CLI**

   Follow the official [Supabase CLI installation guide](https://supabase.com/docs/guides/cli) to install the CLI on your system.

2. **Login to Supabase**

   Run the following command to log in to your Supabase account:

   ```bash
   npx supabase login
   ```

3. **Initialize Your Supabase Project**

   If you haven’t set up Supabase in this project yet, initialize it by running:

   ```bash
   npx supabase init
   ```

4. **Start the Supabase Local Server**

   Launch your local Supabase environment with:

   ```bash
   npx supabase start
   ```

   This command spins up a local PostgreSQL server along with emulators for Auth and Storage, mirroring the production setup for effective local development.

5. **Configure Your Environment**

   Ensure that your `.env` file is up-to-date with the correct Supabase keys and API settings. Compare your configuration with the [Supabase documentation](https://supabase.com/docs) if you’re unsure.

   Set the following environment variables in your `.env` file:

   - `NEXT_PUBLIC_SUPABASE_URL`: The URL of your Supabase project.
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: The anonymous key for your Supabase project.
   - `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID`: The client ID for the Google OAuth provider.
   - `SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET`: The client secret for the Google OAuth provider.

## Keeping Your Supabase Instance Up-to-Date

1. **Fetch Latest Migration History**

   Run the following command to fetch the latest migration history from the remote Supabase database. This is the preferred method to update your local migration files:

   ```bash
   npx supabase migration fetch
   ```

   This ensures that any updates committed remotely are reflected in your local migration setup, keeping your environment in sync.

2. **Review the Changes**

   After fetching the latest migration history, review the differences to confirm that your local setup aligns with the remote configuration.

3. **Proceed with Your PR**

   Once you have verified that your local database is in sync, you can safely proceed with your development and submit your PR. When your PR is accepted and merged, the remote Supabase database will automatically apply the changes.

## Managing Database Migrations

To ensure your database migrations are accurately tracked and up-to-date, incorporate the following commands into your workflow:

- **List Available Migrations:**

  Run `npx supabase migration list` to display all migrations recorded in your project. This helps you verify the order and status of applied migrations.

Regularly using these commands ensures consistency in your development environment before making a PR.

> **Note:** If you choose to run migrations using the Supabase UI instead of the CLI, you must manually pull the local migration files by running `npx supabase db pull --local` to update your migration history. This approach is not recommended because it may not reliably capture all changes, potentially leading to discrepancies between your local setup and the remote database.

## Troubleshooting & Additional Resources

- If you encounter issues while starting Supabase, check that your required ports are free and that you’re using the latest version of the Supabase CLI.
- For further assistance, refer to the official [Supabase Documentation](https://supabase.com/docs) and community resources.

Happy coding!

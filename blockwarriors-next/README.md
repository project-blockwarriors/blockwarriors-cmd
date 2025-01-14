# BlockWarriors Command Block - Next.js App

This is the documentation for the BlockWarriors Command Block - Next.js app.

## Getting Started

1. Clone this repository to your local machine.
2. Install the dependencies using `npm install`.

## Supabase Local Environment Setup

This app uses Supabase as the backend for authentication and database management. To set up a local Supabase environment, follow these steps:

1. Ensure Docker Desktop is installed. If not, download and install it from [Docker's official website](https://www.docker.com/get-started/).
2. Make sure you are in the `blockwarriors-next` folder.
3. Install the Supabase CLI by running `npm install supabase --save-dev`.
4. Start the local Supabase environment with `npx supabase start`.
5. Check the status of the local Supabase environment with `npx supabase status`.
6. Access the Supabase dashboard at `http://127.0.0.1:54323` in your browser.

## Environement Variables Setup

Before running the app, you need to set the following environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`: The URL of your Supabase project.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: The anonymous key for your Supabase project.
- `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID`: The client ID for the Google OAuth provider.
- `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET`: The client secret for the Google OAuth provider.

You can find the Supabase keys in your Supabase status command `npx supabase status`. For Google OAuth keys, you can make your own keys using the [Google Cloud Console](https://console.cloud.google.com/auth/overview). If you are a member of the BlockWarriors team, you can get access to the keys from the team's Discord channel.

## Running the App

Once you have set up the environment variables, run `npm run dev` to start the app in development mode.

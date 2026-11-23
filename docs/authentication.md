# Authentication setup

Mesa Cerca uses Supabase Auth for email/password and Google sign-in.
React displays the forms; Supabase validates credentials, issues sessions
and manages passwords.

The deployed Edge Functions backend validates the token with Supabase Auth
before processing private requests. The browser session does not replace
this server check.

## 1. Supabase project

1. A Supabase account and project are created through the
   [dashboard](https://supabase.com/dashboard).
2. The project receives a name, region and database password. That password stays
   outside version control and is not used in React.
3. The Project URL and publishable key are obtained from Connect or API Keys.
4. These values complete the environment configuration described in
   [Local development](../README.md#local-development). The frontend uses the
   publishable key rather than the secret key, service_role or database password.

## 2. Email and redirects

The Authentication settings use the following configuration:

- The Email provider and user signups are enabled.
- Confirm email is disabled for signup without email verification.
- The server minimum password length is 8 characters, matching the form.
- URL Configuration sets Site URL to `https://proyectodisenosoftware.vercel.app`.
- Redirect URLs include `http://localhost:5173` and
  `https://proyectodisenosoftware.vercel.app`.

The local interface uses port 5173, as described in the README, so its address
matches the authorized redirects.

This version does not verify email ownership or provide password recovery.
It does not require SMTP configuration. Supabase Auth still manages passwords
and sessions. Older accounts awaiting confirmation require separate review;
changing the setting does not establish that those accounts were confirmed.

## 3. Google provider

1. Supabase Authentication > Sign In / Providers > Google displays the callback URL.
   Its format is `https://YOUR_PROJECT.supabase.co/auth/v1/callback`.
2. A Google Cloud project supplies the Google Auth Platform consent configuration,
   including the app name and contact email addresses. Apps in testing include
   participating accounts as test users.
3. A Web application OAuth client contains these authorized JavaScript origins:
   `http://localhost:5173` and `https://proyectodisenosoftware.vercel.app`.
   Its authorized redirect URI is the callback URL copied from Supabase, shared
   by local and production sign-in.
4. Supabase's Google provider receives the Client ID and Client Secret, is enabled
   and has its configuration saved.
5. The Continue with Google button starts sign-in and returns to Mesa Cerca.

The OAuth secret belongs in Supabase rather than `.env.local`. This OAuth client
is separate from the Maps and Places API keys.

## 4. Deployment and checks

Variables and deployment commands are documented in the
[README](../README.md#new-backend-setup). Completed and pending checks appear
in the [test record](testing.md).

## Technical sources

- [React authentication quickstart](https://supabase.com/docs/guides/auth/quickstarts/react)
- [Password authentication](https://supabase.com/docs/guides/auth/passwords)
- [Google authentication](https://supabase.com/docs/guides/auth/social-sign-in/auth-google)
- [Auth email and SMTP](https://supabase.com/docs/guides/auth/auth-smtp)

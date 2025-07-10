# ScorebookSnap - AI-Powered Baseball/Softball Stat Tracker

ScorebookSnap is a full-stack application that allows baseball and softball teams to track player statistics effortlessly. Users can text a picture of their physical scorebook, and our AI-powered backend will automatically parse, digitize, and store the stats. The application features user authentication, team management, public shareable stat pages, and a subscription-based billing system.

## Features

-   **AI-Powered Stat Entry**: Text a photo of a scorebook to automatically update stats.
-   **User Authentication**: Secure sign-up and login with email/password and social providers (Google, GitHub).
-   **Team & Player Management**: Create teams, add players, and manage rosters.
-   **Subscription Billing**: Integration with Stripe for handling subscriptions and payments.
-   **Public Pages**: Shareable, read-only pages for teams to display their stats to fans.
-   **Manual Data Management**: Manually add, edit, and delete game results.
-   **Advanced Sabermetrics**: Calculates advanced stats like wOBA, OBP, SLG, and OPS.

## Tech Stack

-   **Framework**: [Next.js](https://nextjs.org/) (App Router)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/)
-   **Database**: [Supabase](https://supabase.io/) (Postgres)
-   **Authentication**: [Supabase Auth](https://supabase.com/docs/guides/auth)
-   **Payments**: [Stripe](https://stripe.com/)
-   **SMS & AI**: [Twilio](https://www.twilio.com/) for SMS, [Vercel AI SDK](https://sdk.vercel.ai/) with [OpenAI](https://openai.com/) for image processing.
-   **Deployment**: [Vercel](https://vercel.com/)

---

## Deployment to Vercel

Follow these steps to deploy your application to Vercel [^1].

### 1. Push to a Git Repository

Push your project code to a GitHub, GitLab, or Bitbucket repository.

### 2. Import Project on Vercel

-   Go to your [Vercel Dashboard](https://vercel.com/dashboard).
-   Click "Add New..." -> "Project".
-   Import the Git repository you just created.
-   Vercel will automatically detect that it's a Next.js project and configure the build settings.

### 3. Configure Environment Variables

This is the most critical step. In your Vercel project settings, navigate to "Settings" -> "Environment Variables" and add the following variables.

| Variable Name                  | Description                                                              | Where to Find                                                                                             |
| ------------------------------ | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`     | Your Supabase project URL.                                               | Supabase Dashboard > Project Settings > API > Project URL                                                 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`| Your Supabase project's anonymous key.                                   | Supabase Dashboard > Project Settings > API > Project API Keys > `anon` `public`                          |
| `SUPABASE_SERVICE_ROLE_KEY`    | Your Supabase project's service role key (secret).                       | Supabase Dashboard > Project Settings > API > Project API Keys > `service_role` `secret`                  |
| `OPENAI_API_KEY`               | Your API key for OpenAI.                                                 | [OpenAI API Keys Page](https://platform.openai.com/api-keys)                                              |
| `TWILIO_ACCOUNT_SID`           | Your Twilio Account SID.                                                 | [Twilio Console](https://www.twilio.com/console)                                                          |
| `TWILIO_AUTH_TOKEN`            | Your Twilio Auth Token.                                                  | [Twilio Console](https://www.twilio.com/console)                                                          |
| `TWILIO_PHONE_NUMBER`          | Your purchased Twilio phone number.                                      | [Twilio Console > Phone Numbers](https://www.twilio.com/console/phone-numbers/incoming)                   |
| `STRIPE_SECRET_KEY`            | Your Stripe secret API key.                                              | [Stripe Dashboard > Developers > API Keys](https://dashboard.stripe.com/apikeys)                          |
| `STRIPE_WEBHOOK_SECRET`        | The signing secret for your Stripe webhook.                              | [Stripe Dashboard > Developers > Webhooks](https://dashboard.stripe.com/webhooks) > Select your endpoint. |
| `STRIPE_PRO_PRICE_ID`          | The ID of the Stripe Price object for your subscription plan.            | [Stripe Dashboard > Products](https://dashboard.stripe.com/products) > Select your product > Copy Price ID. |
| `NEXT_PUBLIC_SITE_URL`         | The full production URL of your application (e.g., `https://myapp.com`). | Your custom domain or the Vercel-provided domain.                                                         |

**Note**: For `NEXT_PUBLIC_SITE_URL`, use your final production domain. Vercel also provides a system variable `VERCEL_URL` which can be used for preview deployments, but a canonical URL is best for production.

### 4. Run Database Migrations

Before or after your first deployment, you need to run the SQL scripts against your Supabase database to set up the required tables and policies.

-   Go to your Supabase project's [SQL Editor](https://supabase.com/dashboard/project/_/sql).
-   Copy the contents of the SQL files from the `/scripts` directory in this project and run them in the following order:
    1.  `01-initial-schema.sql`
    2.  `02-public-data-policies-fix.sql`
    3.  `03-add-stripe-columns.sql`

### 5. Deploy

Once the environment variables are set, trigger a deployment from your Vercel project dashboard. Vercel will build and deploy your application.

---

## Post-Deployment Steps

After your application is live, you need to update your webhook URLs in Twilio and Stripe.

### Stripe Webhook

1.  Go to your [Stripe Webhooks Dashboard](https://dashboard.stripe.com/webhooks).
2.  Create or update your webhook endpoint.
3.  Set the **Endpoint URL** to `https://<your-domain>/api/webhooks/stripe`.
4.  Select the events to listen for:
    -   `checkout.session.completed`
    -   `customer.subscription.updated`
    -   `customer.subscription.deleted`

### Twilio Webhook

1.  Go to your [Twilio Phone Numbers](https://www.twilio.com/console/phone-numbers/incoming).
2.  Select the phone number you are using for this service.
3.  Scroll down to the "Messaging" section.
4.  Under "A MESSAGE COMES IN", set the webhook to `POST` and the URL to `https://<your-domain>/api/sms`.

Your application is now fully configured and deployed!

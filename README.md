# Fog & Company

A private booking page for visits to San Francisco. Friends and family sign in,
wait to be let in, then take whichever nights are free. You accept or decline,
keep dates for yourself, and everything lands on your Google Calendar.

Everything it runs on has a free tier.

| Piece | Choice | Free allowance |
| --- | --- | --- |
| Hosting | Next.js 15 on Vercel | Hobby plan |
| Database | Supabase Postgres + Drizzle | 500 MB |
| Sign-in | Auth.js v5 — Google & GitHub | unlimited |
| Email | Resend | 3,000/month |
| Calendar | Google Calendar API | unlimited |

---

## How it works

**For a guest.** Sign in with Google or GitHub → give a name → wait. Once you
let them in they see the calendar, pick an arrival and a departure, bring up to
two other people, and leave a note. They can edit or withdraw a request until
you answer it, and cancel a confirmed stay afterwards.

**For you.** Everything sits at `/host`: requests to answer, confirmed stays,
people at the door, and the calendar you draw your own nights onto. `/host/settings`
holds your address and the Google Calendar connection.

**Nights, not days.** A stay from the 12th to the 15th occupies the nights of
the 12th, 13th and 14th. Someone else can arrive on the 15th — the same way a
hotel works.

**What blocks what.** Confirmed stays and nights you've kept are unbookable.
Two people *can* both ask for the same nights; you decide, and the calendar
marks contested dates so nobody is surprised.

### Emails

| When | Who hears about it |
| --- | --- |
| Someone new asks to join | you |
| You let them in / turn them away | them |
| A stay is requested, edited or withdrawn | you |
| You accept a stay | the guest and everyone on the reservation |
| You decline a stay | the guest |
| You cancel a stay, or block over one | everyone on the reservation |
| You change the address | anyone with a confirmed stay ahead |

### Calendar

Accepting a stay creates an all-day event spanning arrival to departure on the
calendar you picked, and invites the guest plus any companions who left an
email address. Cancelling, declining or blocking over it deletes the event and
withdraws the invitations. If the calendar isn't connected, everything else
still works — you just get told the event failed.

---

## Deploying

### 1. Database

Create a project at [supabase.com](https://supabase.com). Then
**Project Settings → Database → Connection string**, and copy two of them:

| Variable | Which one | Why |
| --- | --- | --- |
| `DATABASE_URL` | Transaction pooler, port **6543** | What the app runs on. Built for serverless: many short connections, no prepared statements. |
| `DIRECT_URL` | Session pooler, port **5432** | Only used by `db:push` and `db:secure`. Schema changes need a real session, which a transaction pooler can't give them. |

Nothing is tied to Supabase specifically — the app speaks plain Postgres over
one driver. Neon, Railway, Render or a server of your own all work: set
`DATABASE_URL` and leave `DIRECT_URL` empty.

> **Free tier pauses.** A Supabase project with no traffic for 7 days is paused
> until you wake it from the dashboard. For a page that goes quiet between
> visits, that's worth knowing.

### 2. Google sign-in and calendar

One OAuth client covers both. In the
[Google Cloud console](https://console.cloud.google.com) → **APIs & Services**:

1. **Library** → enable **Google Calendar API**.
2. **OAuth consent screen** → External, add yourself as a test user.
   The app stays in "testing" mode quite happily; it only ever signs in people
   you've listed, and your own account for the calendar.
3. **Credentials** → **Create credentials** → **OAuth client ID** → Web
   application. Add two redirect URIs:

   ```
   https://YOUR-DOMAIN/api/auth/callback/google
   https://YOUR-DOMAIN/api/google/callback
   ```

   The second one is how you hand the app permission to write to your calendar.

Copy the client ID and secret.

### 3. GitHub sign-in (optional)

[github.com/settings/developers](https://github.com/settings/developers) → new
OAuth app → callback `https://YOUR-DOMAIN/api/auth/callback/github`.

### 4. Email

Sign up at [resend.com](https://resend.com) and create an API key.

> Until you verify a domain, Resend only delivers to the address you signed up
> with, and the sender has to stay `onboarding@resend.dev`. Guests won't get
> anything. Verifying a domain you already own takes a few DNS records and is
> free — do that before inviting people.

### 5. Deploy

Push to GitHub, import the repo at [vercel.com](https://vercel.com), and set the
environment variables from [`.env.example`](./.env.example):

```
DATABASE_URL, AUTH_SECRET, HOST_EMAIL,
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET,
GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET,   # optional
RESEND_API_KEY, EMAIL_FROM,
NEXT_PUBLIC_APP_URL
```

`DIRECT_URL` is only needed on your own machine for `db:push` and `db:secure` —
Vercel never uses it.
`AUTH_SECRET` is any random string — `openssl rand -base64 32`.
`NEXT_PUBLIC_APP_URL` must be your real URL, since it's what email links and the
Google redirect are built from.

### 6. Create the tables, then lock them down

From your machine, pointing at the production database:

```bash
DIRECT_URL="postgresql://…:5432/postgres" npm run db:push
DIRECT_URL="postgresql://…:5432/postgres" npm run db:secure
```

The second command matters on Supabase. Supabase publishes every table in the
`public` schema through its REST API, so a table with row-level security off is
readable by anyone holding the project's anon key — including your guest list
and everyone's email address. `db:secure` switches RLS on for every table,
adds no policies, and revokes the API roles' grants. That denies the REST API
everything.

The app is unaffected: it connects as the tables' owner over Postgres, and
owners aren't subject to RLS. Run it again any time you add a table. On a
plain Postgres it's harmless — the API roles simply don't exist.

### 7. Set yourself up

Sign in with the address in `HOST_EMAIL` — that account is made host
automatically. Then:

- **Settings → Connect Google Calendar**, and pick which calendar stays go on.
- **Settings → Your address**, so guests know where to turn up.

Now send people the link.

---

## Running it locally

```bash
npm install
npm run db:local     # a real Postgres, downloaded on first run — no Docker
npm run db:push      # in a second shell: create the tables
npm run dev
```

`db:local` keeps its data in `.localdb/`; delete that directory to start over.
It's a real PostgreSQL, so it behaves like production. Point `DATABASE_URL` at
it in `.env.local`:

```
DATABASE_URL=postgres://postgres:postgres@localhost:5432/postgres
```

Add the Google/GitHub redirect URIs for `http://localhost:3000` to your OAuth
apps if you want to sign in locally. Without `RESEND_API_KEY` emails are
skipped and logged to the console instead, which is usually what you want in
development.

---

## Adjusting it

Most of the knobs are in [`src/lib/constants.ts`](./src/lib/constants.ts):

| Setting | Default | |
| --- | --- | --- |
| `HOST_EMAIL` | `nowlow77@gmail.com` | the account that runs the place |
| `MAX_COMPANIONS` | 2 | extra people per stay |
| `MAX_NIGHTS` | 30 | longest stay without asking you directly |
| `BOOKING_HORIZON_DAYS` | 400 | how far ahead the calendar goes |
| `APP_NAME` / `APP_CITY` / `APP_TIMEZONE` | Fog & Company / San Francisco / America/Los_Angeles | |

Each has an environment variable of the same name.

## Layout

```
src/
  app/            pages — /, /welcome, /lobby, /stay, /trips, /host/*
  actions/        server actions: account, trips, host
  components/     calendar, forms, cards
  lib/
    schema.ts     database tables
    availability.ts   who's staying when, and what collides
    calendar.ts   Google Calendar
    email.ts      Resend + the email template
    notify.ts     every message the app sends
    dates.ts      plain YYYY-MM-DD arithmetic, no timezone drift
    db.ts         one Postgres connection, pooler-friendly
```

# Brisbane Clicker

A live click-counter leaderboard for Queensland, Australia. Click to climb the ranks, save your score, and compete with other Brisbane clickers in real time.

**Live:** [brisbaneclicker.com](https://brisbaneclicker.com)

---

## Features

- **Anonymous play** — start clicking instantly, no account required
- **Live leaderboard** — top 10 updated in real time via Supabase Realtime
- **Rank tracker** — see your current position and how many clicks to climb
- **Save your score** — upgrade from anonymous to a named account at any time, score preserved
- **Custom username** — set your display name after saving, unique across all players
- **Queensland only** — geo-restricted to QLD via IP detection
- **Delete account** — wipe all data including auth, score, and profile

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Database & Auth | Supabase (Postgres + Auth + Realtime) |
| Styling | Tailwind CSS |
| Deployment | Vercel |

---

## Architecture

**Click batching** — clicks are accumulated in memory and flushed to Supabase every 3 seconds via an API route, not on every individual click. On tab close, remaining clicks are sent via `navigator.sendBeacon`.

**Anonymous sessions** — users get a UUID on first visit stored in localStorage. This maps to a row in the `users` table. When they sign up, that row is updated with their auth ID — score is never lost.

**Live leaderboard** — the leaderboard subscribes to Supabase Realtime on the `clicks` table. Any INSERT or UPDATE triggers a re-fetch of the top 10.

**Geo-restriction** — on mount, the app calls `/api/location` which checks the user's IP against ip-api.com. Non-Queensland users see a block page. Development bypasses this check automatically.

---

## Database Schema

```sql
users       — id, display_name, city, is_anonymous, auth_user_id
clicks      — user_id, total_clicks (UNIQUE on user_id)
leaderboard — view joining users + clicks (user_id, display_name, city, total_clicks)
```

Row Level Security is enabled on both tables. The `increment_clicks` RPC function handles atomic click increments via `INSERT ... ON CONFLICT DO UPDATE`.

---

## Local Development

**Prerequisites:** Node.js 18+, a Supabase project

**1. Clone and install**
```bash
git clone https://github.com/diwaslama/clicker
cd clicker
npm install
```

**2. Configure environment**
```bash
cp .env.local.example .env.local
```

Add your Supabase credentials to `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**3. Apply database migration**
```bash
supabase db push
```

**4. Seed dummy data (optional)**
```bash
npm run seed          # populate 15 Brisbane clickers
npm run seed:cleanup  # remove seed data
```

**5. Run dev server**
```bash
npm run dev
```

---

## Deployment

Deployed on Vercel. Every push to `main` triggers an automatic deployment.

Add the same three environment variables from `.env.local` to your Vercel project under **Settings → Environment Variables**.

---

## Supabase Setup Notes

- Enable Realtime on the `clicks` table: **Database → Publications → supabase_realtime → add clicks table**
- Disable email confirmation for frictionless signup: **Authentication → Providers → Email → Confirm email → off**
- The `increment_clicks` function requires EXECUTE grants for `anon` and `authenticated` roles (included in the migration)
# Setup (Supabase + Vercel)

Email accounts + synced bookmarks. Sign up once, sign in on any device.

## 1. Install and run locally

```bash
npm install
cp .env.example .env
# fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev
```

## 2. Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** and run [`supabase/migrations/20260727100000_init.sql`](../supabase/migrations/20260727100000_init.sql).
3. **Authentication → Providers → Email**: enabled (default). Disable Google if it was turned on.
4. For smoother personal use, under **Authentication → Providers → Email**, you can turn **off** “Confirm email” so sign-up logs you in immediately. Leave it on if you want confirmation emails.
5. **Authentication → URL configuration**:
   - Site URL: your Vercel production URL (e.g. `https://rakisorr.vercel.app`)
   - Redirect URLs: `http://localhost:5173/**` and `https://YOUR_VERCEL_DOMAIN/**`
6. **Project Settings → API**: copy Project URL and `anon` `public` key into `.env`.

## 3. Deploy on Vercel

### Option A — Vercel dashboard

1. Import this GitHub repo at [vercel.com/new](https://vercel.com/new).
2. Framework preset can stay blank; `vercel.json` sets build → `dist`.
3. Add env vars:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy. Copy the production URL into Supabase Site URL / Redirect URLs.

### Option B — CLI

```bash
npm i -g vercel
vercel login
vercel link
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
npm run deploy
```

## Behaviour

- **Signed out:** built-in defaults, read-only.
- **Create account / Sign in:** email + password via Supabase Auth.
- **First sign-in (empty DB):** defaults are seeded to your account.
- **Edit mode:** add/edit/delete bookmarks and sections; changes sync to Supabase.
- **Export / Import / Reset:** JSON backup and restore.

Public freemium / Stripe is deferred — see [`PUBLICATION-PLAN.md`](PUBLICATION-PLAN.md).

# Bookmarks

Personal start page with email accounts and cross-device sync (Supabase + Vercel).

## Quick start

```bash
npm install
cp .env.example .env   # add Supabase URL + anon key
npm run dev
```

Full setup (SQL migration, email auth, Vercel deploy): [`docs/SETUP.md`](docs/SETUP.md).

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Local Vite server |
| `npm run build` | Production build → `dist/` |
| `npm run deploy` | Deploy to Vercel (`vercel --prod`) |

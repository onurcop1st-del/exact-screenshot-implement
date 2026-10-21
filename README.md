# ONUR Streetwear

Mobile-first streetwear shop: product grid, full-screen product view, GET list with order codes, WhatsApp ordering, comments and replies, shopper profiles, and an admin inventory page.

Built with [Lovable](https://lovable.dev). Continue developing in the [Lovable editor](https://lovable.dev/projects/b60375e6-d4cd-4546-804c-9dd4a45ceacf).

## Stack

- React 19 + TanStack Start v1 (SSR), Vite 7, Tailwind CSS v4
- Lovable Cloud (Supabase) for auth, database, and photo storage
- Bun for installs and scripts

## Local development

```sh
bun install
bun run dev
```

## Deploying on Render (web service)

The app builds to a Node server (`.output/server/index.mjs`), so use a **Web Service**, not a Static Site.

Exact tools and settings:

1. Push this repo to GitHub, then in [Render](https://render.com) choose **New → Web Service** and connect the repo.
2. Settings:
   - **Runtime:** Node
   - **Build Command:** `curl -fsSL https://bun.sh/install | bash && export PATH="$HOME/.bun/bin:$PATH" && bun install && bun run build`
   - **Start Command:** `node .output/server/index.mjs`
   - **Node version:** 20 or 22 (set `NODE_VERSION` = `22` under Environment if needed)
3. Environment variables (Render → Environment → Add):
   - `VITE_SUPABASE_URL` — your backend URL (see `.env` in this repo)
   - `VITE_SUPABASE_PUBLISHABLE_KEY` — your publishable key (see `.env`)
   - `VITE_SUPABASE_PROJECT_ID` — your project id (see `.env`)
4. Deploy. Render gives you a public `*.onrender.com` URL.

Notes:

- The server listens on the `PORT` Render provides — no extra config needed.
- The database, auth, and photo storage stay on Lovable Cloud; Render only hosts the web app. Keep the same env values so both point at one backend.
- Free Render instances sleep when idle; the first visit after idle takes a few seconds.

## Publishing with Lovable instead

Click **Publish** in the Lovable editor — no server setup needed.

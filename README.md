# ONUR — Streetwear Shop

Mobile-first streetwear store: product grid, full-screen product view, GET list with order codes, WhatsApp ordering and a hidden owner inventory page. Products, orders, photos and the owner login live in the cloud backend, which is already connected through the `.env` file in this repository.

---

# Deploy on Render (Web Service) — step by step

This repository is ready for Render. It contains a `render.yaml` file, so Render can read every setting automatically.

## Option A — One-click Blueprint (easiest)

1. Sign in at https://dashboard.render.com.
2. Click **New → Blueprint**.
3. Connect your GitHub account and pick this repository.
4. Render reads `render.yaml` and shows a service called **onur-shop**. Click **Apply**.
5. Wait until the service says **Live**, then open the `onrender.com` link.

That's it. Future pushes to GitHub redeploy automatically.

## Option B — Manual Web Service

1. In Render click **New → Web Service** and choose this GitHub repository.
2. Fill in exactly:

| Field | Value |
| --- | --- |
| Language / Runtime | **Node** |
| Branch | `main` (or the branch with the latest code) |
| Root Directory | leave **blank** (`package.json` is at the repository root) |
| Build Command | `npm install -g bun@1.4.4 && bun install --frozen-lockfile && NITRO_PRESET=node-server bun run build` |
| Start Command | `node .output/server/index.mjs` |
| Health Check Path | `/` |

3. Under **Environment Variables** add:

| Name | Value |
| --- | --- |
| `NODE_VERSION` | `22` |
| `NITRO_PRESET` | `node-server` |
| `NITRO_HOST` | `0.0.0.0` |

Do **not** add `PORT` — Render sets it itself.

4. Click **Create Web Service** and wait for **Live**.

## Backend settings

The backend address and public key are read from the committed `.env` file, so nothing else is needed. They are public browser values, not passwords. Never commit the owner password or any secret/service key.

## After every update

Push to GitHub → Render rebuilds automatically. If a change doesn't show, open the service and click **Manual Deploy → Clear build cache & deploy**.

## Troubleshooting

| Problem | Fix |
| --- | --- |
| "This page didn't load" | Clear build cache & deploy. Check Build Command includes `NITRO_PRESET=node-server` and the Start Command is `node .output/server/index.mjs`. |
| `Cannot find module .output/server/index.mjs` | The build made the wrong output; same fix as above. |
| `bun: command not found` | Build Command must start with `npm install -g bun@1.4.4 &&`. |
| Products don't load | Make sure `.env` is in the repository and the cloud backend isn't paused. |
| Site slow on first visit | Free Render instances sleep when idle; a paid instance stays awake. |

## Local development

```sh
bun install
bun run dev
```

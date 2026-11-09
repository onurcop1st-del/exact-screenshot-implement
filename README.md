# ONUR Streetwear

ONUR is a mobile-first shopping website with a product grid, full-screen product view, GET list, order codes, WhatsApp ordering, and a hidden owner inventory page. Shoppers can pick products without signing in; inventory management requires the owner account.

Built with React 19, TanStack Start v1, Vite, Tailwind CSS v4, and Lovable Cloud for products, orders, owner authentication, and original-quality product photos. Bun installs dependencies; Node runs the production server on Render.

# Deploy on Render: step-by-step

**Choose a Render Web Service, not a Static Site.** This application needs a running server. These instructions deploy the website while keeping its existing Lovable Cloud data and photo storage.

> Important: the default build configuration targets Lovable hosting. On Render, set `NITRO_PRESET=node-server` before building to generate the Node entry point `.output/server/index.mjs`. Do not assume an ordinary build has produced a Node server.

## 1. Get the tools and accounts ready

You need:

- **GitHub:** an account with access to this repository.
- **Render:** an account at [render.com](https://render.com).
- **The existing backend configuration:** the three `VITE_SUPABASE_*` values listed in step 4, copied from this project's configuration without changing them.
- **Node 22.23.4 and Bun 1.4.4:** the commands below select these versions on Render. You do not need to install either on your computer for dashboard deployment.

You do **not** need Docker, a Render database, a persistent disk, a separate SQL editor, or a new owner account to deploy this existing store.

## 2. Make sure the latest code is on GitHub

1. Open the repository on GitHub and select the branch you want to deploy.
2. Confirm its latest commit contains `package.json`, `bun.lock`, `bunfig.toml`, `vite.config.ts`, `src/`, and `public/` at the repository root.
3. If GitHub is not connected yet, open **Project settings → Git → Connect GitHub** in Lovable. Complete the connection and wait for the code to sync.
4. Keep the repository private unless you intentionally want to share its source.

Do not upload `node_modules`, `.output`, repository metadata, passwords, private keys, or a secrets file. Render installs dependencies and creates the production output itself. The publishable browser key is not an administrator credential.

## 3. Create the Render Web Service

1. Sign in to the Render dashboard.
2. Click **New → Web Service**.
3. Choose **Git Provider** and connect your GitHub account if needed.
4. Allow Render access to the repository. For a private repository, grant access to that specific repository.
5. Select the ONUR repository and click **Connect**.
6. Enter these settings:

| Render field | Value |
| --- | --- |
| Name | A unique service name, such as `onur-shop` if available |
| Language / Runtime | **Node** |
| Branch | The branch containing the latest store code; use its actual name |
| Region | A region suitable for your customers and backend |
| Root Directory | Leave blank when `package.json` is at the repository root |
| Build Command | Copy the command below |
| Start Command | `node .output/server/index.mjs` |
| Instance Type | Choose a plan; a paid instance avoids free-instance idle spin-down |

### Exact Build Command

Paste this as **one line** into Render's Build Command field:

```sh
curl -fsSL https://bun.sh/install | bash -s "bun-v1.4.4" && export PATH="$HOME/.bun/bin:$PATH" && NODE_ENV=development bun install --frozen-lockfile && NITRO_PRESET=node-server bun run build && test -f .output/server/index.mjs
```

This installs the pinned Bun version, includes development dependencies needed for compilation, uses the committed lockfile, builds the Node version of the website, and checks that the expected entry point exists. The temporary `NODE_ENV=development` applies only to dependency installation; the service itself runs in production mode.

### Exact Start Command

```sh
node .output/server/index.mjs
```

Do not use `bun run dev`, `vite preview`, or a static-file server as the production Start Command. Leave any static-site Publish Directory field unused; a Web Service starts the server instead.

## 4. Add environment variables before deploying

In the creation form, open **Environment Variables** and add each row below. If the service already exists, use its **Environment** page instead.

| Name | Value to enter |
| --- | --- |
| `NODE_VERSION` | `22.23.4` |
| `NODE_ENV` | `production` |
| `NITRO_PRESET` | `node-server` |
| `NITRO_HOST` | `0.0.0.0` |
| `VITE_SUPABASE_URL` | Copy the existing value for this exact variable from your project |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Copy the existing publishable key from your project |
| `VITE_SUPABASE_PROJECT_ID` | Copy the existing value for this exact variable from your project |

Copy only the named configuration values from the project's `.env` or environment settings. Do not paste actual values into this README, a GitHub issue, or a public message. Avoid extra quotation marks and trailing spaces when entering them in Render.

- **Keep all three browser configuration values from the same existing backend.** Changing them to another project will not transfer your products or owner account.
- **Do not manually set `PORT` or `NITRO_PORT`.** Render supplies `PORT`; the generated Node server reads it. `NITRO_HOST=0.0.0.0` makes the server reachable by Render.
- **Do not copy Lovable sandbox/preview environment flags into Render.** They are not production settings and may force a different build target.
- **Never add the owner's email password or a privileged database key to a `VITE_*` variable.** Those variables are included in the browser bundle.
- The current shopping and owner inventory flows use the existing browser client. They do not require a database password or service-role key for this deployment; those credentials are not available from Lovable Cloud.

The generated server-side clients also support `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` as runtime configuration. If a server-side feature needs them, set them to the same existing URL and publishable key respectively; these are not replacements for the three build-time variables above.

**Changing a `VITE_*` value requires a new build and deployment.** Restarting the running service alone will not update values already compiled into the website.

## 5. Deploy and inspect the logs

1. Review the commands and environment values.
2. Click **Create Web Service** or **Deploy Web Service**, depending on the dashboard screen.
3. Open the service's **Logs** while Render installs and builds.
4. Check that the build selects the `node-server` preset and finishes successfully.
5. Check that Render starts `node .output/server/index.mjs` and detects the listening port.
6. Wait until Render marks the service **Live**.
7. Open the HTTPS `onrender.com` address shown on the service page.

Render supplies HTTPS for the public URL. Do not configure a local SSL certificate or make the Node server listen on port 443.

## 6. Check the real store after deployment

Use the deployed Render URL, not only the Lovable preview:

- [ ] Open the home page and confirm your cloud products, prices, stock, and photos load.
- [ ] Reload and confirm the product grid still works.
- [ ] Search for an existing product code and open that product.
- [ ] Open its full-screen product view, then use Back to return to the grid.
- [ ] Press **GET**, open the GET list, and confirm the selected item appears.
- [ ] Generate an order code and check the WhatsApp button opens the expected order message. Opening WhatsApp does not itself confirm payment or send the message.
- [ ] Refresh a product URL directly and also refresh `/get`; both should load without a routing 404.
- [ ] Open the hidden owner link at the bottom of About, sign in with the existing owner account, and verify inventory appears.
- [ ] Select a photo in the owner form and confirm its preview appears before saving. If testing an upload, use a deliberate test item, verify the saved photo, then remove the test item.
- [ ] Sign out of the owner page and reload it; inventory must remain hidden until sign-in.
- [ ] Check the store on a phone as well as a desktop.

Products, orders, authentication, and uploaded photos remain in Lovable Cloud. They are not copied into Render's filesystem and do not disappear when Render rebuilds. Keep that backend active; hosting the website on Render does not remove its usage or storage costs.

## 7. Owner authentication and the new website address

The existing owner email/password login continues to use the same backend. Do not create a new owner or enable shopper signup just to deploy.

If you later enable password-reset links, email sign-in links, or social sign-in, their approved site and redirect URLs must include the final Render/custom-domain address. Request that configuration through Lovable before testing those flows. A successful password login alone does not verify email-link or social-sign-in settings.

## 8. Deploy future changes

1. Save changes to the same GitHub branch Render is watching.
2. If automatic deployment is enabled, Render builds after each new commit on that branch.
3. To deploy manually, open the service and choose **Manual Deploy → Deploy latest commit**.
4. After changing build-time environment values, choose the option that saves them and rebuilds/deploys the service.
5. If dependencies or cached output seem stale, choose **Manual Deploy → Clear build cache & deploy**.
6. Recheck products and the GET-to-WhatsApp flow after each deployment.

Publishing through Lovable is separate from Render deployment. Code reaches Render through the repository and branch connected to its service. Live database changes affect the shared backend immediately, including both preview and Render.

## 9. Optional: connect your own domain

1. Deploy successfully on the Render-provided URL first.
2. Open the Render service's **Settings → Custom Domains** and add your domain.
3. Copy the DNS records Render shows into your domain provider's DNS settings.
4. Wait for verification and the HTTPS certificate.
5. Test the home page, a product link, GET, and owner sign-in on the custom domain.
6. Update approved authentication redirect URLs if you use any link-based sign-in flows.

Use the DNS records displayed for your service, not guessed IP addresses or records copied from another website. See [Render's custom-domain guide](https://render.com/docs/custom-domains).

## 10. Troubleshooting

| Problem | What to check |
| --- | --- |
| `bun: command not found` | Use the complete Build Command, including the installer and `export PATH`. |
| Frozen lockfile installation fails | Ensure `package.json` and `bun.lock` are from the same commit. Reconcile them with the pinned Bun version in development, commit both, and redeploy. Do not delete the lockfile as a workaround. |
| Missing Vite or build packages | Keep `NODE_ENV=development` on the install command so development dependencies are installed. |
| `.output/server/index.mjs` is missing | Confirm Root Directory and the Node preset. Review the first build error, not just the final failed-start message. |
| The process exits immediately or logs mention a Cloudflare build | Set `NITRO_PRESET=node-server`, remove copied preview flags, and clear the build cache before deploying again. A Cloudflare entry point is not a listening Node server. |
| No open port detected | Confirm the Start Command and `NITRO_HOST=0.0.0.0`; remove custom `PORT`/`NITRO_PORT` overrides and inspect startup logs. |
| Products or photos are missing | Verify the three browser environment values match the existing backend, rebuild, check stock/search filters, and confirm the backend is active. Do not reseed or replace real products to fix hosting. |
| Owner login fails | Check the backend configuration, existing owner account, and browser network errors. Do not put owner credentials in source code or enable public admin signup. |
| Refreshing `/get` or a product returns 404 | Use a Web Service and the Node Start Command. TanStack handles these paths; no SPA rewrite file is required. |
| Environment changes do not appear | Rebuild and deploy; browser configuration is compiled at build time. |
| First visit is slow | Free Render instances spin down after inactivity. A paid always-on instance avoids that idle delay. |
| Build runs out of memory | Check Render logs and select a build/service plan with enough resources; do not switch to the development server. |
| Deployment fails after previously working | Inspect the first error, correct it, then redeploy. Render normally keeps the previous successful version serving when a new build fails. |

## 11. Local development and an optional production check

For development, install the same Node and Bun versions, configure the existing backend values locally, then run:

```sh
bun install --frozen-lockfile
bun run dev
```

To check the Render-style production output on your own computer, outside the Lovable preview environment:

```sh
NODE_ENV=development bun install --frozen-lockfile
NITRO_PRESET=node-server bun run build
test -f .output/server/index.mjs
NODE_ENV=production NITRO_HOST=0.0.0.0 PORT=3000 node .output/server/index.mjs
```

Open `http://localhost:3000` and run the checks from step 6. These commands use a Bash-compatible shell; on Windows use WSL or set environment variables with the equivalent PowerShell syntax. Never commit local secrets or generated output.

This guide documents the deployment procedure; it is not confirmation that a Render deployment has already been performed.

## Official references

- [Render Web Services](https://render.com/docs/web-services)
- [Deploying a Node service on Render](https://render.com/docs/deploy-node-express-app)
- [Render-provided environment variables](https://render.com/docs/environment-variables)
- [Setting the Node.js version](https://render.com/docs/node-version)
- [Free instance limitations](https://render.com/docs/free)
- [Bun installation](https://bun.sh/docs/installation)

## Publishing with Lovable instead

Open **Publish → Publish changes** in the Lovable editor. This is an alternative website host; it is not required for deploying the same code on Render.

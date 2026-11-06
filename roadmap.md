# Roadmap

## Open
- Done: TikTok-style product scrolling and cool aqua palette with Dark, Light and default product-image-blurred Mix mode.
- Done: shopper signup/sign-in without confirmation codes, comments/replies, editable usernames, initial avatars with 100 colours, profile tab, and private GET history; live signup, reply, history reload and non-admin access verified. User explicitly approved the current backend for this work.
- Done: secure admin sign-out and expired-session handling; unit tests passed, owner inventory/sign-out/reload verified in browser.
- External Supabase migration: blocked on a new Lovable project connected to the user's external Supabase; no supported in-place switch. Keep existing Cloud data intact until transfer is verified.
- Done: one owner admin role preserved; shopper signup now enabled separately and never grants admin.
- GitHub: user wants all code in a new repo (Git sync). Blocked: only the user can connect it in Project settings → Git → Connect GitHub.
- Answered: storage is not unlimited (Free plan, 20 credits/month Cloud allowance, metered by size; 0 files uploaded so far).
- Done: dependency security fixes — source-map-js 1.2.2 and js-yaml 4.3.2 in bun.lock (GHSA-68fv-2mgg-jv7q, GHSA-5p4m-2wfm-xmqj, GHSA-2883-xcg3-v3hh); tests and build pass.
- Done: home is a free-scroll 2-per-row grid; tapping a product opens the full-screen TikTok-style view at /product/$code with a back button; comment counts on comment buttons; admin upload shows a photo preview and uploads the original file un compressed; README has exact Render web service deploy steps; sign-in verified to persist across reloads.

## Waiting on user
- Instagram link (from the uploaded brief) — add next to TikTok/WhatsApp once supplied.
- Real founding date, city, brand story ("Founded in 2026 may" is a placeholder).
- Real product list to replace invented seed items.

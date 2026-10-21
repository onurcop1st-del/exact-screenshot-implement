# Roadmap

## Open
- Done: TikTok-style product scrolling and cool aqua palette with Dark, Light and default product-image-blurred Mix mode.
- Done: shopper signup/sign-in without confirmation codes, comments/replies, editable usernames, initial avatars with 100 colours, profile tab, and private GET history; live signup, reply, history reload and non-admin access verified. User explicitly approved the current backend for this work.
- Done: secure admin sign-out and expired-session handling; unit tests passed, owner inventory/sign-out/reload verified in browser.
- External Supabase migration: blocked on a new Lovable project connected to the user's external Supabase; no supported in-place switch. Keep existing Cloud data intact until transfer is verified.
- Done: one owner admin role preserved; shopper signup now enabled separately and never grants admin.
- GitHub: user wants all code in a new repo (Git sync). Blocked: only the user can connect it in Project settings → Git → Connect GitHub.
- Answered: storage is not unlimited (Free plan, 20 credits/month Cloud allowance, metered by size; 0 files uploaded so far).
- Dependency security fixes (GHSA-68fv-2mgg-jv7q source-map-js, GHSA-5p4m-2wfm-xmqj + GHSA-2883-xcg3-v3hh js-yaml): not started. Check lockfile, re-resolve transitively, verify build; bun install --save-text-lockfile if only binary bun.lockb.
- In progress: home back to free-scroll grid (4 per page); TikTok snap-scroll view opens when a product is tapped, with a back button to the grid; comment count shown on the comment button; admin upload shows selected photo preview and keeps full quality; README gets exact Render web service deploy steps; sign-in stays saved across reloads.

## Waiting on user
- Instagram link (from the uploaded brief) — add next to TikTok/WhatsApp once supplied.
- Real founding date, city, brand story ("Founded in 2026 may" is a placeholder).
- Real product list to replace invented seed items.

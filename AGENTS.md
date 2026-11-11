<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Admin Auth lifecycle belongs in `use-admin-session`; use the configured Auth client, clear query caches before sign-out, and hide inventory on invalid sessions to prevent stale admin data.
- Shopper identity and private profile/history reads belong in `ShopperProvider`; keep its state identity-scoped and database RLS authoritative so shopper accounts never imply admin access.
- Appearance is controlled by `AppearanceProvider` and semantic global CSS tokens; derive Mix imagery from the visible product and keep avatar palette definitions in CSS for consistent theming.
- Product replies use the comments parent relation with database validation that parent and reply share a product; keep GET history owner-only and treat “got” as shopper-reported, not payment confirmation.
- Home is a free-scroll two-column grid; the full-screen snap-scroll feed lives only on the product detail route, entered by tapping a product and exited with its back button — never reintroduce snap scrolling on the home grid.
- Admin product photos upload as the original file with no resizing or recompression, and the form shows a local preview of the selected file before saving.
- AI product recommendations run in a server function (src/lib/recommend.functions.ts) via the AI Gateway SDK; results are filtered to codes that exist in the catalog so the model cannot invent products.

- Product detail route is a Jumia-style single product page (details, specs, related, small how-to-order note); AI description drafting is an admin-only server fn (src/lib/describe.functions.ts) whose output fills an editable textarea — why: owner reviews AI text before saving.

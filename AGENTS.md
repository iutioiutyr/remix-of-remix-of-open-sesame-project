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

- The site (ported from Vue) lives in `src/app/`; shared stores use `@vue/reactivity` and React reads them via `useV()` in `src/app/reactive.ts` — keeps the original store logic unchanged.
- The app shell (`src/app/App.tsx`) is loaded client-only from `__root.tsx` because Firebase and browser APIs run at module load.
- Data and auth stay on the existing Firebase project; PesaPal calls go through `/api/public/pesapal/*` which injects server secrets.

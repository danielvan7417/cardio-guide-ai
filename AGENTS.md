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

## Authentication
- Keep registration validation in a shared Zod schema used by the form and its public server function, so both enforce the same password rules without privileged signup.
- Keep the accepted browser-only login cooldown in localStorage, synchronized across tabs; count invalid credentials only, not service failures, and never store passwords.

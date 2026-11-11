<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules

- AI calls go through `@lovable.dev/ai-gateway`, imported dynamically inside server handlers only (`src/lib/ai.functions.ts`, `src/routes/api/chat.ts`); shared system prompts and responsible-AI rules live in `src/lib/ai.server.ts`. Why: keeps the server-only SDK out of the browser bundle and one source of AI behaviour.
- Email and research prompts are built client-side by `src/lib/prompts.ts` in a fixed ROLE → CONTEXT → TASK → REQUIREMENTS → OUTPUT FORMAT structure and shown to the user, who may edit them. Why: transparent, editable prompts are a product requirement.
- Chat streams via the `/api/chat` server route (AI SDK UI message stream) and the server verifies the bearer token, saves the user message, and rebuilds history from the database before calling the model. Why: the model must see full history and persistence must not trust the client.
- Signed-in pages live under `src/routes/_authenticated/` (client-only gate + sidebar shell in `src/components/app-shell.tsx`). Why: session is in localStorage, so the gate cannot run during SSR.

# Agent notes

## Git

- Do NOT `git push` unless the user explicitly asks. Commit locally is fine.
- Verify with `npx tsc --noEmit` after TS changes (no dedicated lint script).

## Env / scripts

- `src/lib/channels/temu.ts` and `src/lib/channels/db.ts` read env vars at module-load
  time — in scripts, call `dotenv.config({ path: ".env.local" })` first and use
  dynamic `await import()` for anything that transitively imports them.
- TEMU scripts: `scripts/temu-push.ts` (batch push, `--dry`/`--sku`/`--only`),
  `scripts/temu-resubmit.ts <sku> <goodsId>`, `scripts/temu-product-detail.ts <goodsId>`,
  `scripts/temu-cat-recommend.ts <parentCatId>` (lists child categories).

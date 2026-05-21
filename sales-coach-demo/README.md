# sales-coach demo workspace

A clean Claude Code sandbox to evaluate the **`sales-coach` skill** against the **`sales-crm` MCP server**, without the rest of the POC project in scope.

Launch Claude Code from this directory and you get:
- The `sales-coach` skill (auto-activates on sales/deal questions)
- The `sales-crm` MCP tools (`query_describe`, `query_search`, `query_fetch`)
- A seeded CRM database (10 deals across 7 stages — prospect through won/lost)

…and nothing else. No POC source, no schema migration history, no architectural context. The Claude session sees a finished product: a sales agent + a CRM tool.

## Prerequisites (one-time, in the parent POC project)

```bash
cd ..
docker compose up -d                              # Postgres on :5532
bun src/seed.ts                                   # populate the 10-deal corpus
```

## Launch

```bash
cd sales-coach-demo
claude                                            # or however you launch Claude Code
```

The MCP server boots automatically (configured in `.claude/settings.json`). The skill auto-activates on relevant prompts.

## Try these

See [`try-these.md`](./try-these.md) for sample seller prompts spanning the lifecycle (call prep, objection review, stuck-deal triage, lost-deal post-mortem, pipeline review).

## What's actually in this folder

```
sales-coach-demo/
├── README.md                              # this file
├── CLAUDE.md                              # session-level project context
├── try-these.md                           # sample prompts
└── .claude/
    ├── settings.json                      # wires the sales-crm MCP
    └── skills/
        └── sales-coach/                   # symlink → ../../.claude/skills/sales-coach
```

The `sales-coach` skill is symlinked from the parent project — edits to the canonical skill propagate without copy/paste drift.

## Portability notes

The `.claude/settings.json` uses an **absolute path** for the MCP server (`/Users/dug/…`). If you move this workspace or share it, update that path to match. Bun must be on PATH.

The symlinked skill resolves to `../../.claude/skills/sales-coach`. The link is committed as a relative path, so it survives moves *within* the POC repo but breaks if you copy this directory elsewhere — in that case, copy the skill folder explicitly.

## Deactivating

Quit Claude Code; the MCP server shuts down with the session.

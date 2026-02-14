# cli-agent

Terminal utility that converts natural language to shell commands via a local Ollama model.

## Tooling

- Runtime: Bun (not Node.js). Use `bun run`, `bun test`, `bun install`.
- Linting/formatting: Biome. Run `bun biome check --write` to lint and format.
- No dotenv needed — Bun loads `.env` automatically.

## Typescript

- Always use arrow functions; always use types over interfaces.

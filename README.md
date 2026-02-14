# vague-cli

Translates your vague intentions into shell commands, because in these modern times it apparently doesn't matter if you're correct as long as you're close enough.

Powered by a local 3B parameter model - small enough to be fast, dumb enough to be entertaining.

## Prerequisites

- [Bun](https://bun.sh)
- [Ollama](https://ollama.com) with `qwen2.5-coder:3b` pulled: `ollama pull qwen2.5-coder:3b`

## Install

```bash
bun install
```

## Usage

```bash
bun run index.ts "list all png files larger than 1mb"
# → find . -name "*.png" -size +1M
```

## Shell integration (zsh)

Add to your `.zshrc`:

```zsh
# vague-cli: type natural language, press Option+, to convert to a command
vague-cli() {
  local saved="$BUFFER"
  BUFFER="⟳ generating…"
  zle -R
  local result="$(bun ~/path/to/vague-cli/index.ts "$saved" 2>/dev/null)"  # ← adjust to your install path
  if [[ -n "$result" ]]; then
    BUFFER="$result"
    CURSOR=${#BUFFER}
  else
    BUFFER="$saved"
    CURSOR=${#BUFFER}
  fi
}
zle -N vague-cli
bindkey '≤' vague-cli
```

Then type a description in your terminal, press `Option+,`, and the buffer is replaced with the generated command. Press enter to run, or edit it first if you don't fully trust a 3B model with your filesystem.

## Configuration

| Variable       | Default                  | Description         |
| -------------- | ------------------------ | ------------------- |
| `OLLAMA_URL`   | `http://localhost:11434` | Ollama API endpoint |
| `OLLAMA_MODEL` | `qwen2.5-coder:3b`       | Model name          |

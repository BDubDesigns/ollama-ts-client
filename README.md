# ollama-ts-client

A small TypeScript experiment for calling a local Ollama model, validating the model's JSON output with Zod, and printing basic generation metrics.

The current script asks a local model to write an ocean haiku as JSON, extracts the JSON from the response, validates it, and logs token and duration information returned by Ollama.

## Prerequisites

- Node.js with npm
- Ollama running locally
- A local Ollama model named `gemma-local`, or an update to the `model` value in `src/index.ts`

The script sends requests to:

```text
http://localhost:11434/api/generate
```

## Install

```sh
npm install
```

## Run

```sh
npm run start
```

## Typecheck

```sh
npm run typecheck
```

## Build

```sh
npm run build
```

## Notes

- `Modelfile` is intentionally ignored because it can be large and machine-specific.
- `node_modules/` and build output are ignored as generated files.
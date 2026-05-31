# src/api Guide

This directory contains API boundary modules. It is not a place for React page UI.

## Responsibilities

- Isolate external IO, raw payloads, and controller contracts from views.
- Keep API modules replaceable when Supabase is replaced by an HTTP server.

## Rules

- Views should import query hooks or controller providers, not service internals.
- Raw database table names and row shapes must stay inside gateway/mapper code.
- Domain models exposed to the rest of the app should use app-level camelCase naming.

## Performance Rules

- Use the `taglow-performance-first` skill for API boundary changes.
- Before adding a call, check whether an existing query can be cached, seeded, batched, or moved into an RPC.
- Keep responses minimal and avoid returning bulk inserted rows unless callers use them.
- Keep query keys stable and cache windows explicit for read-mostly data such as published survey structure and signed URLs.
- For broad API changes, request a sub-agent read-only performance review when available.

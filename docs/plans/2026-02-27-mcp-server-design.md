# MCP Server Design - sedekah.je

## Overview

Public MCP (Model Context Protocol) server enabling AI assistants to query and filter Malaysian religious institutions from the sedekah.je directory. Read-only access to approved institutions via HTTP/SSE transport, deployed as a Next.js API route on the existing Railway infrastructure.

## Architecture

```
Client (Claude, Cursor, etc.)
    |  SSE/HTTP
    v
/api/mcp (Next.js Route Handler)
    |
    v
MCP Server Instance (lib/mcp/)
    |
    v
Drizzle ORM -> PostgreSQL
```

## Files

| File | Purpose |
|------|---------|
| `lib/mcp/server.ts` | MCP server instance + tool registration |
| `lib/mcp/tools/search-institutions.ts` | Search & filter tool |
| `lib/mcp/tools/get-institution.ts` | Get single institution by slug |
| `lib/mcp/tools/list-filter-options.ts` | List available filter values |
| `lib/mcp/tools/get-random-institution.ts` | Random institution |
| `app/api/mcp/route.ts` | HTTP/SSE transport endpoint |

## MCP Tools

### 1. `search_institutions`
- Inputs: `search?`, `category?`, `state?`, `payment_method?`, `page?`, `limit?`
- Returns: paginated list of approved institutions (name, category, state, city, QR info, coords)

### 2. `get_institution`
- Input: `slug` (required)
- Returns: full institution details including social media, description, address

### 3. `list_filter_options`
- No inputs
- Returns: `{ categories, states, payment_methods }`

### 4. `get_random_institution`
- No inputs
- Returns: one random approved institution

## Security

- Read-only, no mutations
- Only approved institutions returned
- No auth required (public data)
- Rate limiting via existing infra

## Dependencies

- `@modelcontextprotocol/sdk` - official MCP TypeScript SDK

## Decisions

- **Transport**: HTTP/SSE via Next.js route handler (deploys with existing Railway)
- **Scope**: Public read-only, core query + filter tools only
- **Data**: Database-only (static data already migrated to DB per recent commit)

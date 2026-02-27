# MCP Server Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a public MCP server to sedekah.je so AI assistants can query and filter Malaysian religious institutions.

**Architecture:** Next.js API route at `/api/[transport]/route.ts` using `mcp-handler` + `@modelcontextprotocol/sdk`. Four read-only tools wrapping existing Drizzle queries against PostgreSQL. Deploys on existing Railway infra.

**Tech Stack:** mcp-handler, @modelcontextprotocol/sdk@^1.25.2, zod@^3, Drizzle ORM, Next.js App Router

---

### Task 1: Install dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install mcp-handler and MCP SDK**

Run: `bun add mcp-handler @modelcontextprotocol/sdk`

**Step 2: Verify installation**

Run: `bun run type-check`
Expected: No new type errors

**Step 3: Commit**

```bash
git add package.json bun.lock
git commit -m "feat(mcp): add mcp-handler and @modelcontextprotocol/sdk dependencies"
```

---

### Task 2: Create MCP route handler with first tool (list_filter_options)

**Files:**
- Create: `app/api/[transport]/route.ts`

**Step 1: Create route handler with list_filter_options tool**

```typescript
import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { db } from "@/db";
import { institutions } from "@/db/schema";
import {
	categories,
	states,
	supportedPayments,
} from "@/lib/institution-constants";
import { and, count, eq, ilike, inArray, or, sql } from "drizzle-orm";

const handler = createMcpHandler(
	(server) => {
		server.registerTool("list_filter_options", {
			title: "List Filter Options",
			description:
				"Returns all available filter values for querying institutions: categories, Malaysian states, and supported payment methods.",
			inputSchema: {},
		}, async () => {
			return {
				content: [{
					type: "text",
					text: JSON.stringify({
						categories: [...categories],
						states: [...states],
						payment_methods: [...supportedPayments],
					}, null, 2),
				}],
			};
		});
	},
	{},
	{
		basePath: "/api",
		maxDuration: 30,
	},
);

export { handler as GET, handler as POST, handler as DELETE };
```

**Step 2: Verify build**

Run: `bun run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add app/api/\\[transport\\]/route.ts
git commit -m "feat(mcp): add MCP route handler with list_filter_options tool"
```

---

### Task 3: Add search_institutions tool

**Files:**
- Modify: `app/api/[transport]/route.ts`

**Step 1: Add search_institutions tool**

Register a new tool that accepts optional search, category, state, payment_method, page, and limit parameters. Query the institutions table with Drizzle using the same pattern as the existing `/api/institutions` route. Only return approved institutions. Return paginated results as JSON text content.

**Step 2: Verify build**

Run: `bun run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add app/api/\\[transport\\]/route.ts
git commit -m "feat(mcp): add search_institutions tool"
```

---

### Task 4: Add get_institution tool

**Files:**
- Modify: `app/api/[transport]/route.ts`

**Step 1: Add get_institution tool**

Register a tool that accepts a required `slug` string parameter. Query a single approved institution by slug with full details (name, description, category, state, city, address, QR image, QR content, supported payments, coordinates, social media). Return 404-style message if not found.

**Step 2: Verify build**

Run: `bun run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add app/api/\\[transport\\]/route.ts
git commit -m "feat(mcp): add get_institution tool"
```

---

### Task 5: Add get_random_institution tool

**Files:**
- Modify: `app/api/[transport]/route.ts`

**Step 1: Add get_random_institution tool**

Register a tool with no inputs that returns one random approved institution using `ORDER BY RANDOM() LIMIT 1`. Return a subset of fields (name, category, state, city, QR info, coords, slug).

**Step 2: Verify build**

Run: `bun run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add app/api/\\[transport\\]/route.ts
git commit -m "feat(mcp): add get_random_institution tool"
```

---

### Task 6: Test MCP server end-to-end

**Step 1: Start dev server**

Run: `bun dev`

**Step 2: Test MCP endpoint responds**

Run: `curl -X POST http://localhost:3000/api/mcp -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}'`
Expected: JSON-RPC response with server capabilities

**Step 3: Verify build passes**

Run: `bun run build`
Expected: Build succeeds

**Step 4: Commit any fixes if needed**

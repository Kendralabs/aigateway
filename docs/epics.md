# Epics, Stories & Tasks

## Epic E1 – AI Gateway Core Platform
**Goal:** Provide a robust, secure, and extensible gateway that routes LLM requests and MCP tool calls.

| Story | Description | Tasks (sub‑tasks) | Dependencies |
|-------|-------------|-------------------|--------------|
| **S1.1** | **Server bootstrap & API** – spin up the gateway HTTP server, load provider configs, expose `/v1/chat/completions` endpoint. | - Implement `start-server.ts` entry point.<br>- Add health‑check routes.<br>- Configure graceful shutdown. | – |
| **S1.2** | **MCP request handling** – parse `MCPToolset`, resolve `mcp_server_name`, forward to external MCP server. | - Design `src/providers/mcp/` client.<br>- Integrate cache lookup (`mcpServersCache`).<br>- Serialize/deserialize `mcp_tool_use` & `mcp_tool_result`. | S1.1 |
| **S1.3** | **Cache & credential management** – load `mcp‑servers‑auth.json` into `mcpServersCache`, refresh on change. | - Implement cache loader.<br>- Add CLI to import new MCP server credentials.<br>- Write unit tests. | S1.1 |
| **S1.4** | **Observability & metrics** – expose Prometheus metrics, structured logs, request tracing. | - Integrate `prom-client`.<br>- Add request‑ID middleware.<br>- Emit latency & guard‑rail counters. | S1.1 |

## Epic E2 – Security & Guardrails
**Goal:** Enforce the identity, access, and content‑security policies defined in the spec.

| Story | Description | Tasks | Dependencies |
|-------|-------------|-------|--------------|
| **S2.1** | **Token validation & hierarchy cache** – verify JWT against KIAM JWKS, cache hierarchy context (60 s TTL). | - Implement JWKS fetch & verification (<50 ms).<br>- Store hierarchy in `hierarchyCache`.<br>- Cache invalidation logic. | – |
| **S2.2** | **Policy Decision Point integration** – call KACP PDP, enforce OPA/OpenFGA decisions. | - Build HTTP client to `/api/v1/hierarchy/validate`.<br>- Interpret decision payload (`allow|deny|review|step_up`).<br>- Fail‑closed on timeout. | S2.1 |
| **S2.3** | **PII detection & redaction** – integrate Presidio‑style classifier on outbound prompts. | - Add middleware to scan `messages`.<br>- Replace detected PII with tokens.<br>- Store token map for optional rehydration. | S2.2 |
| **S2.4** | **Prompt‑injection & jailbreak defense** – run rule‑engine before dispatch. | - Load injection‑pattern rules.<br>- Block or sanitize malicious content.<br>- Emit audit entry on block. | S2.2 |
| **S2.5** | **Output filtering & rehydration** – post‑process provider response for toxicity, policy violations, and optional PII re‑insertion. | - Integrate NeMo Guardrails/Toxicity classifier.<br>- Apply rehydration lookup if allowed.<br>- Log final decision. | S2.3, S2.4 |
| **S2.6** | **Audit‑Vault emission** – create bitemporal decision‑trace nodes for every guard‑rail action. | - Define PROV‑O schema.<br>- Push nodes to Kendra Context Graph via async queue.<br>- Include explanation hash. | S2.5 |

## Epic E3 – MCP Front‑End (Admin Dashboard & Playground)
**Goal:** Deliver a modern UI for operators and developers to manage MCP servers, policies, and test requests.

| Story | Description | Tasks | Dependencies |
|-------|-------------|-------|--------------|
| **S3.1** | **Project scaffolding** – Vite + React + TypeScript, CI integration. | - Initialise Vite project under `frontend/`.
- Configure ESLint, Prettier, Jest.
- Add CI step to build & test. | – |
| **S3.2** | **Authentication flow** – OIDC login against KIAM, token storage, role‑based UI rendering. | - Implement `AuthProvider`.
- Guard routes by scopes (`ai:admin`, `ai:monitor`). | S3.1 |
| **S3.3** | **MCP Server Management UI** – list, create, edit, revoke virtual keys. | - Table component showing server name, status, TTL.
- Modal dialogs for create/edit.
- Wire to backend CRUD endpoints (to be added in Epic E4). | S3.2 |
| **S3.4** | **Policy Editor** – visualize OPA bundles, enable toggles for PII, injection, output filters. | - Tree view of policy rules.
- Checkbox toggles that PATCH policy via backend.
- Live preview of guard‑rail impact. | S3.2 |
| **S3.5** | **Playground** – send arbitrary prompts, select target MCP server, view guarded request/response trace. | - Prompt textarea, model selector.
- Show before/after redaction, injection block reason, final provider output.
- Export trace as JSON. | S3.2, S2.1‑S2.6 |
| **S3.6** | **Observability dashboards** – token‑validation latency, cache hit/miss, guard‑rail trigger counts. | - Charts built with Recharts or Chart.js.
- Pull metrics from `/metrics` endpoint.
- Provide download CSV. | S3.1, S1.4 |

## Epic E4 – Backend Admin APIs (to power the UI)
**Goal:** Expose CRUD operations for MCP server configs, virtual keys, and policy bundles.

| Story | Description | Tasks | Dependencies |
|-------|-------------|-------|--------------|
| **S4.1** | **MCP server CRUD** – GET/POST/PUT/DELETE `/api/v1/mcp/servers`. | - Validate payloads against `MCPToolset` schema.
- Persist to `mcp-servers-auth.json` and refresh cache.
- Authorization check via PDP. | S2.1, S2.2 |
| **S4.2** | **Virtual‑key lifecycle** – issue, list, revoke keys per workspace. | - Generate signed JWTs with limited scope.
- Store revocation list in Redis (or in‑memory for prototype).
- API endpoints `/api/v1/keys`. | S4.1 |
| **S4.3** | **Policy bundle upload** – accept OPA bundle zip, store versioned config. | - Verify bundle signature.
- Trigger cache invalidation for policy engine.
- Return version ID. | S2.2 |

---

> **Dependencies across epics** – Core Platform (E1) must be stable before Security (E2) can enforce policies, and both must be available before the Front‑End (E3) and Admin APIs (E4) are useful.

---

*All epics, stories, and tasks are drafted to be importable into Jira as `User Story` issues (e.g., `AI‑GW‑E1‑S1.1`).*

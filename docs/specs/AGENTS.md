# KAIG — Kendra AI Gateway: Agent / CLI Context Pack

This folder is the exported, self-contained specification set for the **Kendra AI Gateway (KAIG)**, formatted as plain Markdown for consumption by a coding CLI (Claude Code, Codex, Cursor, Aider, etc.).

Source: Kendra Labs Notion — "Kendra AI Gateway (KAIG) — Definitive Documentation" v1.2.0 (2026-07-18).

## One-line definition

KAIG is the OpenAI-compatible control plane between every Kendra app, agent and MCP client and every model — Cloud SaaS, BYO-Cloud, local (Ollama / LM Studio), or customer data centre — enforcing intelligence-arbitrage routing, reliability, identity-aware governance, token-aware FinOps, guardrails, and end-to-end observability as configuration rather than scattered application code.

## File index

| File | Contents | Read when |
| --- | --- | --- |
| `00-overview.md` | Hub: capability groups, north-star metrics, NFR baselines, design principles, glossary, plane boundaries | Always read first |
| `01-vision-strategy-business-case.md` | Problem, thesis, personas, objectives, ROI levers, scope | Product/PRD work |
| `02-reference-architecture-connectors.md` | Data plane, control plane, four connector families, storage stack, topologies, failure semantics, anti-patterns | System design, service scaffolding |
| `02a-ingress-pre-routing-pipeline.md` | 13 ordered pre-routing stages, fail-open/closed matrix, latency budget, requirements checklist | Implementing gateway ingress/middleware |
| `03-routing-reliability-arbitrage.md` | Routing modes, classifier, load balancing, retries/fallback/circuit breakers, residency routing, canary, LiteLLM/Portkey mechanics | Implementing the router |
| `04-identity-access-governance.md` | Seven-level hierarchy, JWT handshake, RBAC/ReBAC/ABAC, virtual keys, JIT/HITL, PEP→PDP | Auth & policy code |
| `05-finops-token-economics.md` | Token economics, wallets, budgets/quotas, attribution, semantic + prefix caching, cost levers | Metering, budgets, caching |
| `06-security-guardrails.md` | Threat surface, PII redaction/rehydration, injection defense, output filtering, secrets, compliance | Guardrail services |
| `07-observability-metering-modelops.md` | Usage events, logging discipline, metrics, OTel GenAI, ModelOps, drift watch, Langfuse model | Telemetry pipeline |
| `08-provider-model-price-management.md` | Provider registry, full model-card schema (JSON), price cards, lifecycle, console APIs | Registry/console implementation |
| `09-roadmap-adoption-source-library.md` | Phasing, SLA targets, risks, production checklist, incident playbooks, sources | Planning and sequencing |

## Hard constraints any implementation must satisfy

- **Latency**: gateway overhead target 3–5 ms; < 10 ms typical; ≤ 25 ms P99 edge, ≤ 50 ms P99 enterprise (excludes provider inference).
- **Response time**: gateway-attributable P95 ≤ 100 ms, P99 ≤ 200 ms.
- **Throughput**: ≥ 350 req/s per vCPU; ≥ 1,000 concurrent connections per node.
- **Scale envelope**: ~1,000 concurrent agent sessions; ~10,000 concurrent workflow executions.
- **Availability**: 99.99% effective uptime via multi-provider failover.
- **Cache**: 30–50% of qualifying traffic served from cache.
- **Arbitrage**: ≥ 70–85% of traffic routed below the frontier tier; 40–80% cost reduction vs flat-frontier baseline.
- **Identity**: every request resolves to `trace_id`, `actor_id`, `workspace_id`, `wallet_id` before any spend or model exposure.
- **Keys**: raw provider keys never reach client code; callers use virtual keys only.
- **Posture**: fail closed for identity/authz/residency; fail soft for budget; fail open only for telemetry.

## Design principles (non-negotiable)

1. Token economics is engineering, not accounting — every architectural decision is a cost decision.
2. Route work to the cheapest model that can reliably do it; frontier tier is the exception.
3. Centralise governance, decentralise consumption — one control plane, many calling apps.
4. Attribute everything — trace id, actor id, workspace id, wallet id on every call.
5. Cache aggressively, summarise structurally.
6. Fail soft on budget exhaustion — hard caps plus clear escalation beat silent retries.
7. Bound the agent loop — per-query token ceilings and bounded retries by default.
8. Treat governance as code — policies, budgets and routes are declarative configuration.

## Suggested build order

1. `02a` ingress pipeline skeleton (auth → authz → validation → budget → residency → guardrails → classify → cache).
2. `08` provider/model/price registry (the router must never hardcode model names).
3. `03` router + reliability primitives.
4. `05` wallets, budgets, semantic cache.
5. `06` guardrail services.
6. `07` usage events + OTel GenAI export.

## Conventions for the coding agent

- The registry is the source of truth: no hardcoded model names, prices, or provider endpoints anywhere in code.
- Routes, budgets, guardrail policies and allowlists are declarative config (GitOps), hot-reloaded via Redis — not code branches.
- Config resolution order is always: model defaults → route overrides → call overrides, each validated against the model card's allowed ranges.
- Every new capability must state its latency cost against the budget in `00-overview.md`.

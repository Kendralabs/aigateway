# 01 · Vision, Strategy & Business Case

**KAIG Definitive Documentation v1.2.0** · Last updated 2026-07-18 · Status: Active

KAIG converts ungoverned, app-embedded model calls into a single managed platform capability. This document states the problem, the personas, the objectives, and the financial case.

## 1. The problem

Over the last 18–24 months, "calling an LLM" has shifted from a simple API integration to a platform problem. The driver is not just scale — it is variability: model quality, latency, rate limits, pricing and provider reliability all change quickly, while security and regulatory expectations rise.

Teams that embed model calls directly into product services create brittle systems with duplicated auth logic, inconsistent governance, fragmented observability, and unpredictable spend. GenAI cost scales **non-linearly** with usage through context bloat, unbounded retries, untiered model use, and absent per-user/per-feature attribution. Every team that ships an agent re-invents these controls in isolation — producing bill shock, opaque chargeback, and runaway agent loops.

## 2. The thesis

An AI gateway resolves these gaps at the infrastructure layer instead of in every application:

- **Provider abstraction** eliminates lock-in — one OpenAI-compatible integration point reaches 100+ backends.
- **Intelligent routing & fallbacks** move reliability from app code to infrastructure, targeting 99.99% uptime.
- **Token-aware governance** replaces crude request throttling with exact financial budgets.
- **Semantic caching** bypasses providers for repeat work, cutting cost 30–50%.
- **Unified telemetry** dismantles the black box of third-party API usage.

KAIG's thesis takes a deliberate side in a live industry debate. A prominent counter-position argues the gateway should remain a **dumb, stateless, ultra-low-latency proxy**, with routing and evaluation pushed to the edges. KAIG instead runs intelligence — classification, semantic cache, guardrails, budget pre-checks — **in path**, while holding itself to a contractual latency budget and keeping all state externalised so nodes stay stateless and horizontally scalable. Full reconciliation: doc 03 §13.

## 3. Personas

| Persona | Need KAIG serves |
| --- | --- |
| Application developer | One stable API; swap models without refactoring |
| AI / platform architect | Multi-modal routing, residency control, build/buy clarity |
| Site reliability engineer | Failover, circuit breakers, health checks, uptime SLA |
| FinOps manager / controller | Token budgets, attribution, chargeback, forecasting |
| Security & privacy officer | PII redaction, prompt-injection defense, audit lineage |
| ML engineer | Drift detection, eval gating, model lineage |
| Platform administrator | Provider registry, virtual keys, policy-as-code |
| Compliance officer / MLRO (regulated FS) | Regula overlays applied per route (see §8) |

## 4. Objectives & non-functional targets

- Single OpenAI-compatible surface for all model classes (SaaS, BYO-Cloud, Local, Customer DC).
- 99.99% effective uptime via failover; ≤ 5 ms added latency on the critical path (edge), ≤ 50 ms in enterprise mode with full guardrails.
- Support up to ~1,000 concurrent agent sessions and ~10,000 concurrent workflow executions.
- Every request carries trace id, actor id, workspace id, and wallet id for full attribution.
- Governance, routes and budgets expressed as declarative GitOps configuration.

### 4.1 Non-functional requirement baselines

| Dimension | Requirement |
| --- | --- |
| Latency overhead | Target 3–5 ms; < 10 ms typical; ≤ 25 ms P99 edge · ≤ 50 ms P99 enterprise |
| Response time (gateway-attributable) | P95 ≤ 100 ms · P99 ≤ 200 ms, excluding provider inference |
| Throughput | ≥ 350 requests/second per vCPU |
| Concurrency | ≥ 1,000 concurrent connections; scale to ~1,000 agent sessions / ~10,000 workflow executions |
| Availability | 99.99% effective uptime via failover |
| Scalability | Horizontal scaling on Kubernetes; safe multiple-times-per-day deploys |

## 5. Business case

The gateway is the highest-yield component of the broader data-modernization investment. Illustrative 3-year benefit envelope synthesized from the PRD portfolio:

| Benefit category | Driver |
| --- | --- |
| Operational cost savings | Semantic caching + intelligence-arbitrage routing |
| Prevented compliance fines | PII redaction + DLP at the gateway |
| Avoided failed projects | Provider agnosticism / no lock-in |
| Productivity gains | Unified developer interface |

The portfolio models a strongly positive cumulative ROI over a 24-month roadmap with a ~12-month payback, anchored by avoided regulatory exposure (GDPR/CCPA) and slashed runaway token spend. Unit economics are framed as **cost per accepted outcome**, not aggregate spend.

### 5.1 Cost levers behind the envelope

- **Intelligence-arbitrage routing** — routing 60–80% of routine requests to smaller models yields a 40–85% cost reduction with no user-facing quality change; frontier models reserved for complex reasoning and generation.
- **Prompt / prefix caching** — cuts repeated input cost by up to ~90% and improves time-to-first-token by 13–31%.
- **Semantic caching** — returns cached responses for similar queries, cutting inference cost up to ~86% on qualifying traffic.
- **Batch API** — a flat ~50% discount for non-urgent workloads.
- **Context discipline** — RAG replaces large document contexts with targeted ~2,000-token retrievals; output-length constraints cut response verbosity by 40%+.

## 6. Scope

**In scope:** routing, reliability, identity-aware governance, FinOps, guardrails, observability, and the provider/model/price registry.

**Out of scope:** foundation-model training/fine-tuning, the vector/RAG retrieval stack (referenced, not specified), and KIAM identity primitives (consumed, not re-specified).

## 7. Plane boundaries & positioning

KAIG is the inference **control plane**. It is not the agent runtime, the self-hosting plane, the AI-governance plane, or the token-efficiency discipline — it routes to, meters, and enforces policy across them.

| Adjacent plane | Boundary with KAIG |
| --- | --- |
| Kendra Model Engine (KME) | Supplies self-hosted (Customer-DC / Local) endpoints KAIG registers and routes to |
| FinOps for Agentic Systems | Defines the token-efficiency levers KAIG governs and meters |
| Kendra Orchestrator / KACP | Durable runtime + in-run LLM Router v2.1; every model call transits KAIG |
| Kendra MCP Server (KMCP) | Tool-plane PEP + Token Vault; KAIG is the peer inference-plane PEP |
| Kendra AI Governance Platform (KAGP) | AI governance / risk tiering KAIG enforces at the model boundary |
| Kendra Data Plane (KDP) · Kendra Context Graph (KCG) | Consume KAIG usage events (data product) and decision traces |
| Kendra Regula | FS regulatory overlays enforced as route-attached policy bundles |

## 8. Regulatory drivers & extended personas

KAIG is the audit and control chokepoint regulators now expect. Drivers: **EU AI Act** (Art. 13 transparency, Art. 14 human oversight, Art. 73 incident), **NIST AI RMF 2026**, **ISO/IEC 42001**, plus FS overlays — **SR 11-7, DORA, BCBS 239, MAS FEAT, FCA Consumer Duty** — applied via Regula. This adds the **Compliance officer / MLRO** persona, served through Regula overlays on KAIG routes.

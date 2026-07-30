# 00 · KAIG Overview (Hub)

**Document version** 1.2.0 · **Last updated** 2026-07-18 · **Status** Active
**Versioning** Semver — MAJOR = breaking architecture/contract change · MINOR = additive capabilities, connectors, plane seams · PATCH = clarifications and fixes.

> **One-line:** The Kendra AI Gateway (KAIG) is the OpenAI-compatible control plane that sits between every Kendra app, agent and MCP client and every model — Cloud SaaS, BYO-Cloud, local (Ollama / LM Studio), or customer data centre — enforcing intelligence-arbitrage routing, reliability, identity-aware governance, token-aware FinOps, guardrails, and end-to-end observability as configuration rather than scattered application code.

## Purpose of this document set

Canonical, definitive documentation for KAIG. It consolidates the AI Gateway playbook, the Kendra BRD/PRD portfolio, the Token FinOps & Routing spec, and external market evidence into a single authoritative reference for engineering, product, security and FinOps.

It answers four questions end to end:

1. **Why** an AI gateway is now mandatory infrastructure, not premature optimization.
2. **What** KAIG is — its architecture, capabilities, and boundaries within Kendra Fabric.
3. **How** it routes, governs, secures, meters and scales model traffic.
4. **When** each capability is earned, via a phased adoption roadmap.

## What an AI gateway is

An AI gateway (LLM gateway, LLM proxy, LLM router) is a unified middleware layer between applications and multiple model providers. It exposes one consistent, OpenAI-compatible API while centralizing routing, reliability, cost control, governance, security and observability. It turns "LLM calls" into a managed platform capability: reliable, auditable, cost-controlled, and provider-agnostic.

The category exists because production breaks the four hidden assumptions of a single direct provider call at once: the provider goes down with no fallback, rate limits start returning 429s, a single expensive model produces an unpredictable bill, and a bad answer is undebuggable because nothing recorded which prompt and model produced it.

## The six capability groups KAIG provides

| Group | What it delivers |
| --- | --- |
| Access abstraction | One OpenAI-compatible request format across 100+ providers; provider normalization; stable SDK behavior |
| Reliability | Retries, timeouts, fallback chains, load balancing, circuit breakers, health checks |
| Cost control | Token-aware budgets, rate limits, attribution, semantic caching, model tiering |
| Governance | KIAM identity, virtual keys, RBAC/ReBAC, model allowlists, policy-as-code, HITL |
| Observability | Logs, traces, token/cost/latency metrics, OTel, ModelOps integrations |
| Quality control | Prompt management, evaluation datasets, drift watch, regression gating |

## Document map

- **01 · Vision, Strategy & Business Case** — problem, personas, objectives, ROI.
- **02 · Reference Architecture & Provider Connectors** — data plane, control plane, four connector families, deployment topologies.
- **02A · Ingress & Pre-Routing Pipeline** — edge/protocol, identity, authz, validation, budgets, residency, guardrails, classification, cache lookup — everything before route selection.
- **03 · Routing, Reliability & Intelligence Arbitrage** — routing modes, classifier, fallback, retries, circuit breakers, canary, arbitrage math.
- **04 · Identity, Access & Governance (KIAM)** — seven-level hierarchy, virtual keys, RBAC/ReBAC, policy-as-code, JIT/HITL.
- **05 · FinOps — Token Economics, Budgets & Caching** — pricing model, wallets, budgets, attribution, semantic caching.
- **06 · Security & Guardrails** — PII redaction, prompt-injection defense, output filtering, compliance.
- **07 · Observability, Metering & ModelOps** — usage events, trace IDs, dashboards, OTel, Langfuse/MLflow.
- **08 · Provider, Model & Price Management (KAIG Console)** — registry, model cards, price cards, lifecycle, local & customer-DC.
- **09 · Implementation Roadmap, Adoption Playbook & Source Library** — phasing, checklists, citations.

## North-star metrics

| Metric | Target |
| --- | --- |
| Cost per accepted output | Continuously decreasing |
| % traffic served from cache | 30–50% |
| % traffic routed below frontier tier | ≥ 70–85% |
| Cost reduction vs. flat-frontier baseline | 40–80% |
| Gateway P99 latency overhead | ≤ 25 ms (edge), ≤ 50 ms (enterprise) |
| Application uptime (with failover) | 99.99% |

## Non-functional requirement baselines

Hard SLOs for the gateway data path, verified in CI load tests and enforced at runtime by circuit breakers. They exclude upstream provider inference time.

| Dimension | Requirement |
| --- | --- |
| Gateway latency overhead | Target 3–5 ms; < 10 ms typical; ≤ 25 ms P99 edge · ≤ 50 ms P99 enterprise (with full guardrails) |
| Response time (gateway-attributable) | P95 ≤ 100 ms · P99 ≤ 200 ms, excluding LLM latency |
| Throughput | ≥ 350 requests/second per vCPU |
| Concurrency | ≥ 1,000 concurrent connections per node |
| Scale envelope | ~1,000 concurrent agent sessions · ~10,000 concurrent workflow executions |
| Availability | 99.99% effective application uptime via failover |
| Scalability & deploy | Horizontal scaling on Kubernetes; safe multiple-times-per-day deploys with automated rollback |

## Design principles

1. Token economics is engineering, not accounting — every architectural decision is a cost decision.
2. Route work to the cheapest model that can reliably do it; frontier tier is the exception.
3. Centralise governance, decentralise consumption — one control plane, many calling apps.
4. Attribute everything — every call carries a trace id, actor id, workspace id, and wallet id.
5. Cache aggressively, summarise structurally.
6. Fail soft on budget exhaustion — hard caps plus clear escalation beat silent retries.
7. Bound the agent loop — per-query token ceilings and bounded retries by default.
8. Treat governance as code — policies, budgets and routes are declarative configuration.

## Glossary (anchor terms)

- **Intelligence arbitrage** — routing work to the cheapest reliable model.
- **Unreliability tax** — extra tokens spent on retries, reflexion loops, validation.
- **Context bloat** — reprocessing irrelevant history; the silent multiplier of spend.
- **Virtual key** — gateway-issued credential proxying a real provider key, scoped to a workspace, with budget and rate limits.
- **Wallet** — the FinOps cost-centre object that owns budgets and consumes usage.
- **PTU** — Provisioned Throughput Unit; converts variable token cost into fixed compute capacity.
- **Config / Route** — declarative routing, reliability and caching policy applied without redeploying app code.

## Cross-plane boundary map (what KAIG owns vs. consumes)

KAIG is one plane in Kendra Fabric. It **owns** the OpenAI-compatible surface, intelligence-arbitrage routing, the provider/model/price registry, virtual keys, token-aware budgets and wallets, guardrail orchestration, and usage metering. It **consumes** the deeper capabilities specified in adjacent definitive docs and must not re-specify them.

| Concern | Owned by | KAIG's relationship |
| --- | --- | --- |
| Self-hosted model serving — engines, GPUs, quantisation, air-gapped DC | Kendra Model Engine (KME) | Registers KME endpoints as Customer-DC / Local providers; routes to them; consumes measured throughput for amortised $/MTok |
| Token-efficiency engineering — KV-cache, serving levers, context discipline, eval-gating | FinOps for Agentic Systems | KAIG is the control plane that governs and meters these levers |
| Durable multi-agent runtime + in-run LLM Router v2.1 | Kendra Orchestrator (governed by KACP) | All model calls transit KAIG; Router v2.1 resolves against KAIG registry ModelCards (doc 03) |
| Tool PEP, On-Behalf-Of delegation, Token Vault, per-agent FinOps | Kendra MCP Server (KMCP) | Shares the PEP→PDP contract and Token Vault; virtual keys project Vault credentials |
| AI governance — risk tiering, AI-BOM, model cards, conformity, governance agents | Kendra AI Governance Platform (KAGP) | Enforces risk-tier model allowlists; emits evidence/decision events KAGP consumes |
| Governed usage-event data + lineage | Kendra Data Plane (KDP) | Publishes usage events as a governed Agentic Data Product on the KDP metadata bus |
| Decision traces, bitemporal memory, explainability | Kendra Context Graph (KCG / Nexus) | Emits routing/guardrail/cache decisions as decision-trace nodes |
| FS regulatory overlays — SR 11-7, DORA, BCBS 239, MAS FEAT, FCA | Kendra Regula / KCG for Financial Services | Attaches FS residency + guardrail policy bundles per route |

## Regulatory drivers

Beyond cost and reliability, KAIG is mandatory infrastructure because it is the single enforcement point where identity-aware governance, PII controls, residency, and auditable lineage are applied to every model call. It is the operational substrate for EU AI Act (Art. 13 / 14 / 73), NIST AI RMF 2026, and ISO/IEC 42001 obligations that KAGP formalises and Regula extends for financial services.

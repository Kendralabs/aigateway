# 09 · Implementation Roadmap, Adoption Playbook & Source Library

**KAIG Definitive Documentation v1.2.0** · Last updated 2026-07-18 · Status: Active

Capabilities are earned, not switched on at once. Adopt visibility first, then control, then governance, then optimization — each phase exiting on measurable criteria.

## 1. Adoption playbook (capability sequence)

1. **Visibility & key management** — route all traffic through KAIG; issue virtual keys; capture logs, tokens, cost. *Exit:* one ledger across providers; no app holds raw keys.
2. **Cost controls & routing** — budgets, rate limits, fallbacks, tiering, classifier v0. *Exit:* budgets enforced; ≥ 70% traffic below frontier; failover proven.
3. **Security & governance** — PII redaction, prompt-injection screening, output filtering, OPA policies, HITL/JIT. *Exit:* >99% PII redaction at <0.5% FPR; policy-as-code live.
4. **Optimization** — semantic caching, prompt compression, batching, learned routing, drift watch. *Exit:* 30–50% cache hit rate; measured cost-per-accepted-outcome decline.

## 2. Delivery phasing

| Phase | Theme | Headline deliverables |
| --- | --- | --- |
| MVP | Unified surface + visibility | OpenAI-compatible ingress, Cloud SaaS connectors, virtual keys, logging/metering, provider registry v1 |
| V1 | Reliability + FinOps | Fallback chains, P2C/PeakEWMA load balancing, circuit breakers, token budgets, wallets, attribution, classifier v0, BYO-Cloud connectors |
| V2 | Governance + optimization | KIAM seven-level enforcement, OPA policy-as-code, PII/guardrails, semantic cache, OTel + ModelOps, Customer DC edge runner, FOCUS export, drift watch |

## 3. Performance & SLA targets

- 99.99% effective application uptime via failover.
- ≤ 5 ms added latency (edge hot path); ≤ 25 ms P99 edge / ≤ 50 ms P99 enterprise gateway overhead.
- KIAM JWT validation < 50 ms; 60-second validation cache.
- Scale to ~1,000 concurrent agent sessions and ~10,000 concurrent workflow executions.
- Gateway-attributable response time P95 < 100 ms · P99 < 200 ms, excluding provider inference.
- Throughput ~350+ requests/second per vCPU; ~1,000+ concurrent connections per node; horizontal scaling on Kubernetes.
- Load-tested at 1,000 req/s with chaos-engineering provider-failure drills; automated rollback on degraded deploys.

## 4. Risk & mitigation

| Risk | Mitigation |
| --- | --- |
| Provider outage / rate limits | Fallback chains, circuit breakers, multi-key load balancing |
| Bill shock / runaway loops | Token budgets, hard caps + soft alerts, bounded agent loops |
| PII leakage / regulatory fines | Pre-call redaction, DLP, residency pinning, audit lineage |
| Vendor lock-in | Provider abstraction, registry-driven routing |
| Silent quality regression | Canary eval-replay, drift watch, gated promotion |
| Cross-region data movement | Residency-tagged routes, never silent cross-region failover |

## 5. Production readiness checklist

- [ ] All traffic transits KAIG; no raw provider keys in app code.
- [ ] Virtual keys scoped to workspaces with budgets + rate limits.
- [ ] Fallback chains + circuit breakers tested against induced failures.
- [ ] Token budgets, wallets and FOCUS export verified end to end.
- [ ] PII redaction + rehydration validated at target precision.
- [ ] OTel traces flowing to ModelOps + warehouse; error logging at 100%.
- [ ] Semantic cache live with hit-rate dashboard.
- [ ] KIAM validation < 50 ms; OPA policies enforced; HITL/JIT paths tested.
- [ ] Provider lifecycle approvals (Architect/Security/FinOps) in place.

## 5a. Incident playbooks

- **Provider outage** — circuit breaker trips on a 5xx / timeout spike → traffic walks the fallback chain; if the chain exhausts, return a structured soft-fail, then confirm the offending `(provider, model, region)` from the alert and hold it out of rotation until the recovery probe passes.
- **Cost spike / runaway loop** — a budget-burn alert (50 / 75 / 90%) or anomalous tokens-per-task → apply a temporary per-key budget or rate cap, inspect the agent loop for unbounded retries, and downshift the wallet to an efficiency tier before hard cutoff.
- **Quality regression** — a drift-watch / eval-replay score drop after a vendor model update → roll the route back to the last-known-good model via GitOps, quarantine the suspect version onto a canary slice, open an eval to confirm.
- **Latency regression** — rising TTFT or a P99 breach → shift the balancer to latency-aware distribution, drain the slow backend, verify the in-path intelligence (classifier, cache, guardrails) still fits the contractual budget (doc 03 §13).

## 6. Source library

**Foundation (Google Drive — "Kendra AI Gateway" folder):**

- Building the AI Control Plane — A primer on AI Gateways (LLM Proxies/Routers)
- AI Gateway PRD Expansion (Enterprise AI Control Plane and Gateway Infrastructure)
- ai-gateway-playbook (Comprehensive Playbook & Requirements Document)

**Other Drive documentation:** BRD — Kendra AI Gateway; Kendra Enterprise AI Gateway; AI Gateway PRD Generation from Documents; AI Gateway PRD Phase 3; [AI Gateway Governance] Doc 1 Overview & Strategy, Doc 4 Phase 3 Resilience; Architecting Enterprise AI Platform; Scaling KOrchestrator Architecture; Gartner Market Guide for AI Gateways; TrueFoundry AI Gateway; Token Management Notes (KIAM).

**Notion foundation — LLM Gateway Playbook:**

- Part 0 — Why LLM Gateways Matter: From One Model to Multi-Model Infrastructure
- Part 1 — Using Portkey as a Managed AI Gateway
- Part 2 — Using LiteLLM as an Open-Source LLM Proxy
- Part 3 — Portkey vs. LiteLLM: Routing, Fallbacks, Cost Tracking & Control
- Part 4 — Langfuse for Tracing, Debugging, Prompt Management, and Evals
- Part 5 — The Production Stack: Gateway + Proxy + Observability for Real AI Apps
- The AI Gateway: Scaling Centralized Inference Across Decentralized Teams

*Synthesis:* Part 0 frames the single-call-to-platform transition (doc 01); Parts 1–2 supply concrete routing, virtual-key, budget and fallback mechanics reconciled in docs 03 & 08; Part 3's decision framework informs the managed-vs-self-hosted reference patterns (doc 02 §14); Part 4 grounds the observability data model (doc 07 §12); Part 5 supplies reference architectures, the timeout-budget model, anti-patterns and incident playbooks (doc 02 §14–15, this doc §5a); the InfoQ talk contributes the "keep the gateway dumb / stateless" counter-position that doc 03 §13 reconciles.

**Notion — related:** Kendra Token FinOps & Routing — Definitive Spec; LLM Gateways for Enterprise Risk — Building an AI Control Plane; Mastering LLM Gateway: Best Practices for AI Model Integration; Kendra MCP Server — Definitive Documentation.

**External evidence:** Portkey, LiteLLM, OpenRouter, Helicone, Kong AI Gateway, Databricks Mosaic AI Gateway, Cloudflare AI Gateway, F5 AI Gateway, Apache APISIX, TrueFoundry, Arch, BricksLLM, Unify AI.

## 7. Cross-plane dependency sequencing

| KAIG phase | Depends on | Dependency |
| --- | --- | --- |
| MVP — unified surface + visibility | Kendra Data Plane (KDP) | Usage-event data product on the metadata bus |
| V1 — reliability + FinOps | KMCP · FinOps for Agentic Systems | Token Vault → virtual-key mapping + OBO; efficiency levers to meter |
| V2 — governance | KAGP · KCG | Risk-tier allowlists + PEP→PDP; decision-trace emission |
| V2 — Customer DC edge runner | Kendra Model Engine (KME) | Self-hosted endpoints, model→stack, amortised $/MTok |
| Vertical rollout — FS | Kendra Regula / KCG-FS | FS regulatory overlays + residency zones |

## 8. Version history

| Version | Date | Status | Changes |
| --- | --- | --- | --- |
| 1.2.0 | 2026-07-18 | Active | Incorporated the LLM Gateway Playbook (Parts 0–5) and the InfoQ "AI Gateway" presentation as first-class sources. Added reference deployment patterns, timeout-budget model and anti-patterns (doc 02); Portkey/LiteLLM routing mechanics and the dumb-vs-smart-gateway tension (doc 03); Langfuse data model (doc 07); reference-gateway config mechanics and market pricing (doc 08); incident playbooks and expanded source library (this doc). |
| 1.1.0 | 2026-07-10 | Active | Expanded requirements across the set, grounded in Google Drive (AI Gateway playbook, PRD portfolio, token-economics papers, OWASP GenAI 2026) and Notion research. Added response-time, throughput and load-test SLA targets. |
| 1.0.0 | 2026-07-04 | Superseded | First cross-plane-aligned governed release. |

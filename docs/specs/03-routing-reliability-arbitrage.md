# 03 · Routing, Reliability & Intelligence Arbitrage

**KAIG Definitive Documentation v1.2.0** · Last updated 2026-07-18 · Status: Active

Routing is the core IP of KAIG: send each request to the cheapest model that can reliably do the job, and keep serving even when providers fail. The router never decides on hardcoded model names — it reads the registry and the declarative route policy.

## 1. Routing modes

| Mode | Selection criterion | Typical use |
| --- | --- | --- |
| Cost | Cheapest model meeting the quality bar | High-volume, low-complexity tasks |
| Quality | Highest eval score for the task class | Frontier reasoning, regulated answers |
| Latency | Lowest TTFT / TPS | Interactive UX, streaming |
| Arbitrage (default) | Cheapest *reliable* model per task class | The everyday path — 70–85% of traffic below frontier |
| Conditional | Rule-based (size, customer, region, A/B) | Large prompts → long-context model; canary slices |

## 2. The task classifier

A small LLM plus heuristics classifies each request (task type, complexity, sensitivity, expected output size) before route selection. The classifier is a versioned model with its own eval datasets; canary replay detects drift after upstream model updates. RouteLLM-style learned routing is a later optimization over the heuristic baseline.

## 3. Intelligence arbitrage math

```
savings = 1 − (actual blended spend / single-model frontier spend)
```

Targets: ≥ 70–85% of calls served below the frontier tier, 30–50% of qualifying traffic served from cache, and a 40–80% cost reduction versus a flat-frontier baseline. The **unreliability tax** (extra tokens from retries, reflexion loops and validation) is treated as routing cost and minimized by bounding the agent loop.

## 4. Load balancing

Requests distribute across multiple keys/providers using **Power of Two Choices (P2C) augmented with PeakEWMA**, weighted by live latency, cost and stability. Weights are read dynamically from the Tier 2 config (PostgreSQL) so operators can shift traffic without redeploys.

## 5. Reliability primitives

- **Retries** — exponential backoff up to a bounded attempt count for transient (429 / 5xx / network) failures.
- **Fallback chains** — e.g. primary OpenAI → secondary Azure OpenAI → self-hosted Llama; the original prompt context is preserved and translated to each provider's syntax on the fly.
- **Circuit breakers** — per `(provider, model, region)` tuple; opens after consecutive failures to stop request oscillation and cascading failure; auto-recovery probe on an interval.
- **Health checks** — every 10s SaaS, 5s Customer DC, 30s Local; unhealthy backends drained from rotation.
- **Timeouts** — per route, with soft-fail structured errors when all paths exhaust.

## 5a. Rate-limit & error handling

- **Configurable error thresholds** — a circuit breaker opens on a configurable failure rate (e.g. ≥ 10% over a rolling window) or a consecutive-failure count; it half-opens on a recovery-probe interval before returning traffic to rotation.
- **Rate-limit awareness** — frontier tiers impose restrictive quotas (e.g. ~50 RPM or ~40,000 input TPM on some standard tiers), where a single 20,000-token context can exhaust half a minute's quota. On HTTP 429 the balancer shifts to rate-limit-aware distribution across keys/providers and walks the fallback chain rather than failing the caller.
- **Routing-strategy catalogue** — round-robin, least-connections, P2C + PeakEWMA, health-aware, and rate-limit-aware balancing; selection strategies are model-based, cost-based, latency-based, or conditional (size / customer / region / A/B).
- **Router overhead** — rule-based and embedding routers hold average selection overhead under ~15 ms, offset by the 200–500 ms TTFT reduction from serving smaller models on qualifying tasks.

## 6. Residency-aware routing

Routes declaring `residency: customer` resolve only to models tagged with the matching `residency_zone`. On failure the operator-declared policy applies: fail closed (503), fail to a peer customer DC, or fail to a pre-approved in-region BYO-Cloud model. Cross-region failover is never silent.

## 7. Caching as a routing decision

Cache lookup (prompt-exact + semantic similarity) runs before any provider call. A semantic hit above the configured cosine threshold (typically 0.85–0.95) returns instantly and bypasses the provider entirely. Caching strategy is owned by the route, not the application. Full caching economics in doc 05.

## 8. Canary & A/B routing

New models, prompts or classifier versions are trialed on a traffic slice with no impact on the main population. Promotion is gated on eval-suite scores and live cost/latency telemetry, then committed via GitOps.

## 9. Parameter resolution

The router resolves request parameters through three levels, each validated against the model card's allowed ranges before the call leaves the gateway:

1. **Model defaults** — temperature, top_p/top_k, max_tokens, stop sequences, system-prompt template.
2. **Route overrides** — declared in the route policy.
3. **Call overrides** — passed by the caller, gated by the virtual key's permission set.

## 10. Reconciliation with KOrchestrator LLM Router v2.1

- **KAIG router (this doc)** — the data-plane inference router for *all* Fabric traffic. Owns provider normalisation, fallback chains, load balancing, residency, caching, budget pre-checks, and metering.
- **KOrchestrator LLM Router v2.1** — the *in-runtime model selection* step for an agent superstep: semantic fit + cost + latency + capability via externalised **ModelCards**, with ≥ 4 fallback models.
- **Contract:** ModelCards are authored and owned in the KAIG Provider Console (doc 08). LLM Router v2.1 *reads* those ModelCards to choose a model, then dispatches the call **through KAIG** — it never opens a direct provider connection. Reliability, residency, caching, and token accounting therefore always happen once, in KAIG.

## 11. Efficiency-aware routing (FinOps for Agentic Systems)

- **KV / prefix-cache awareness** — prefer routes and engines that reuse KV for shared system prompts and tool scaffolding (SGLang RadixAttention); cache tier is a routing input, not only a post-hoc lookup.
- **Model efficiency & arbitrage** — SLMs, distillation, MoE, and LoRA adapters register as cheaper tiers; small-model evaluators gate quality cheaply.
- **Context-token discipline** — prompt compression, structured fact nuggets, and top-k caps cut input tokens before dispatch.
- **Bounded agent loop / unreliability tax** — per-task token ceilings, bounded retries, step budgets, loop-level circuit breakers; retry tokens counted as routing cost.
- **Eval-gated promotion** — every routing, prompt, or model change is gated on LLM eval + agent eval; a cheaper route that fails eval is rejected, not shipped.

## 12. Reference implementations — routing mechanics in the field

**LiteLLM Router (self-hosted).** Multiple `model_list` entries sharing one `model_name` become deployments of a single logical model, balanced by a selectable strategy: simple-shuffle, least-busy, usage-based (`usage-based-routing-v2`), or latency-based. Shared cooldown and usage state must live in Redis so a deployment marked unhealthy by one worker is avoided by all; without it, load-balancing accuracy degrades as pods scale horizontally. Two easily-misconfigured mechanics are pinned as explicit KAIG requirements:

- **`allowed_fails` gates cooldown, not fallback.** It controls how many failures cool a deployment down; it does not by itself trigger cross-model fallback. KAIG keeps the circuit-breaker threshold (§5a) and the fallback chain (§5) as separate controls.
- **`enable_pre_call_checks` is required for context-window fallbacks.** Without pre-call checks the router cannot detect an over-length prompt before dispatch, so a context-window fallback silently never fires. KAIG performs the same pre-flight length check in the pre-routing pipeline (doc 02A).

**Fallback taxonomy.** LiteLLM's three fallback classes map onto KAIG's normalized error handling: general `fallbacks` (rate limits, outages), `context_window_fallbacks` (prompt exceeds context → longer-context model), and `content_policy_fallbacks` (provider content-policy rejection → model with different filtering). Fallbacks resolve left to right until one succeeds; KAIG preserves and translates the original prompt context across each hop.

**Portkey (managed).** Portkey expresses the same policy as a versioned Config ID with strategies `fallback`, `loadbalance`, and `conditional`, targeting a `@provider-slug/model` Model Catalog (per-key virtual keys deprecated in favour of the catalog). Conditional routing uses MongoDB-style query objects; `on_status_codes` scopes which upstream errors trigger a fallback; semantic-cache entries carry a `max_age`. Portkey's data plane is open-source and self-hostable (`npx @portkey-ai/gateway`), keeping the managed-versus-self-hosted decision reversible.

## 13. Design tension — dumb/stateless gateway vs intelligence arbitrage

One school argues the gateway should stay **dumb, stateless, and low-latency** — a thin, horizontally-scalable proxy (a Rust implementation sustains ~200 req/s per instance versus ~60 for a heavier Python proxy) that pushes routing intelligence, evaluation, and state to the edges. KAIG deliberately takes the **in-path intelligence** position: task classifier, semantic cache, in-line guardrails, and budget pre-checks all execute on the hot path.

KAIG reconciles the two rather than hiding the tradeoff:

- The **latency budget is contractual** (doc 02 §2.1, ≤ 25 ms P99 edge). In-path intelligence that cannot fit the budget is demoted to enterprise mode or made asynchronous, preserving a dumb-fast path for latency-critical traffic.
- **State is externalised.** Classifier, cache, and cooldown state live in Redis and vector stores, not in the proxy process, so nodes stay stateless and horizontally scalable.
- **Identity and groups are imported, not invented** — RBAC/ReBAC groups come from the customer IdP (e.g. Entra) via KIAM.
- The gateway is explicitly evolving toward an **agent gateway and MCP gateway** (doc 02 §13), where in-path policy is a feature rather than overhead — but the dumb-fast tier stays available wherever intelligence arbitrage would not pay for its latency.

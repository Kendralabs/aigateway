# 05 · FinOps — Token Economics, Budgets & Caching

**KAIG Definitive Documentation v1.2.0** · Last updated 2026-07-18 · Status: Active

Governing GenAI cost means moving from requests-per-second limiting to token-aware financial constraints, with attribution down to the cost centre and aggressive caching to bypass providers entirely.

## 1. Token economics model

Cost is driven by tokens × price, but the price surface is asymmetric and easy to misread:

- **Input vs. output** — output tokens usually cost several times more than input; verbosity is expensive.
- **Cache read vs. cache write** — cached-read tokens are far cheaper; cache-write carries a one-time premium.
- **Tiered context pricing** — some providers price by context band (e.g. ≤200k vs. >200k); stored as multiple bands on one price card.
- **Hidden costs** — the unreliability tax (retries, reflexion, validation) and context bloat (reprocessing irrelevant history) are the silent multipliers.

The governing unit is **cost per accepted outcome**, not aggregate spend or raw tokens.

## 2. Wallets

A wallet is the FinOps cost-centre object that owns budgets and consumes usage. Every call extracts a `kiam:wallet_id` from the JWT and attributes exact input/output token cost to that wallet. Wallets map to workspaces, teams, features or customers for clean chargeback. Tokens are allocated through a hierarchical structure — L2 (Org) → L3 (Domain) → L4 (Workspace) → L5 (Project) — so cost isolation and granular chargeback hold at every level.

## 3. Budgets, quotas & enforcement

- **Token accounting** — the gateway parses each provider response's `usage` object to compute exact input/output tokens and cost.
- **Hard caps + soft alerts** — soft alert typically fires at ~75% utilization; on exhaustion, further requests return **HTTP 429** with retry-after and an escalation URL (fail soft, never silent).
- **Alert ladder** — budget alerts at 50% / 75% / 90% / 100%, with a grace period before hard cutoff.
- **Graceful degradation** — as a wallet nears exhaustion the router can down-tier to an efficiency-tier model (e.g. 70B → 8B) to preserve service within budget before hard-stopping.
- **Kill switch** — a global "panic button" instantly disables a client, workspace, or realm during a financial or security anomaly.
- **Multi-level limits** — per virtual key, per workspace, per wallet; request/token/dollar quotas over rolling windows.
- **Implementation** — an asynchronous token accumulator backed by a distributed Redis rate limiter, idempotency-key based.

## 4. Attribution & chargeback

Every usage event carries trace id, actor id, workspace id and wallet id, enabling per-team/per-feature chargeback and showback. Events export in **FOCUS** (FinOps Open Cost & Usage Specification) format and align with TBM categories for finance consolidation. Spend across all providers consolidates into one ledger, replacing fragmented per-vendor bills.

## 5. Semantic caching (the largest lever)

- Incoming prompts are embedded into dense vectors and queried against a vector store (pgvector / Pinecone / Milvus / Redis vector search).
- A match above the configured cosine threshold (typically 0.85–0.95) serves the cached response instantly, bypassing the provider.
- Redis/Valkey backs the hot cache with TTL eviction to prevent stale reads.
- Cache hit rate is tracked globally and per workspace, driving toward the 30–50% qualifying-traffic target.
- **Prefix / KV caching** — reusing computed KV tensors for repeated prompt prefixes (system instructions, RAG context) cuts input cost by up to ~90% and improves TTFT by 13–31%; dynamic content (timestamps, IDs) is placed at the end so prefixes stay stable.
- **Measured impact & boundaries** — semantic caching can cut inference cost up to ~86% on qualifying traffic; naive "cache everything" can raise latency, so dynamic tool results are excluded from cache keys.

## 6. Other cost levers

- **Model tiering** — a model-floor strategy routes simple work to cheap models; frontier is the exception (doc 03).
- **Prompt compression** — long-context queries compressed (preserving core meaning) to cut token size materially.
- **Smart batching** — small simultaneous requests batched where the provider supports it (e.g. bulk embeddings).
- **PTU / reserved capacity** — Azure OpenAI PTUs and Bedrock Provisioned Throughput register as flat monthly cost with a fill-rate target; over-spill falls back to pay-as-you-go.
- **Self-hosted amortized $/MTok** — for Local / Customer DC, GPU-hour cost ÷ measured throughput becomes the routing comparison anchor.

## 7. Forecasting & rebalancing

Dashboards track burn rate, cost per accepted outcome, tokens per query/matter/user, and budget utilization vs. ROI (hours saved, revenue unlocked). FinOps continuously rebalances budgets against delivered value rather than chasing a static spend number.

## 8. Efficiency engineering KAIG governs

KAIG owns the **control plane** — budgets, wallets, attribution, caching, and metering. The levers that actually reduce tokens and GPU-seconds are specified by FinOps for Agentic Systems; KAIG governs and meters them:

- **North-star metrics** — cost per accepted outcome, tokens per task, quality-retained-at-cost, unreliability-tax ratio, output-token discipline.
- **Serving efficiency (via KME)** — continuous batching, PagedAttention, quantisation, speculative decoding, GQA, FlashAttention.
- **KV-cache engineering** — prefix / cross-request reuse, KV quantisation, eviction policy; target 30–50% served from cache (prompt + KV + semantic).
- **Model efficiency & arbitrage** — SLMs, distillation, MoE, LoRA adapters; cheap small-model evaluators.
- **Context / retrieval discipline** — compression, structured fact nuggets, top-k caps.
- **Bounded agentic loop** — token ceilings, bounded retries, step budgets, loop circuit breakers.
- **Eval-gated efficiency** — never cut cost blind; every change passes LLM + agent eval.

## 9. Per-agent wallets (KMCP) & self-hosted economics (KME)

- **Per-agent wallets** extend §2–§3 via the KIAM **Token Vault** wallet id that KMCP already attributes; KAIG consolidates inference + tool + provider spend into one wallet per agent/workspace.
- **Self-hosted amortised cost** — amortised $/MTok = GPU-hour cost ÷ measured throughput; break-even versus frontier SaaS is roughly **~2M tokens/day**, and PTU / reserved capacity is modelled as flat cost. This is the cost anchor the router uses for self-hosted routes (doc 03).

## 10. Metering as a governed data product (KDP)

Budget and attribution data is exported in **FOCUS / TBM** form and published onto the KDP metadata bus as a governed Agentic Data Product, so FinOps reporting is queryable and lineage-traced rather than a private ledger (mechanics in doc 07).

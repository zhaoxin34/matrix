# AI Matrix - E-commerce Demo Platform

## What This Is

A simulation testbed for researching AI autonomous decision-making and learning. The e-commerce platform (demo site + CDP) serves as an environment where AI agents can observe business operations, learn from mentor-student interactions, and eventually operate independently to maximize ROI.

This is Phase 1: Build the e-commerce platform architecture and engineering foundations. Features come later.

## Core Value

Establish a robust, evolvable architecture that enables rapid iteration on AI research while providing realistic business simulation data.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] E-commerce platform architecture established (backend + frontend scaffolding)
- [ ] Engineering workflows operational (git hooks, lint, format, type-check, test)
- [ ] Database schema designed and migrations ready
- [ ] Docker development environment configured

### Out of Scope

- Feature implementation (browse, cart, checkout, etc.)
- CDP platform
- User behavior simulator
- Agent communication platform
- Real payment integration

## Context

**AI Research Goal:** Create a mentor-student AI architecture where:
- Mentor agent: Expert in e-commerce operations (knows when/what to do)
- Student agent: Observes mentor, experiments in simulation, learns decision-making
- CDP: Control panel the AI uses to take actions and gather data

**Current Phase Focus:** Architecture and engineering infrastructure only. The README has detailed PRD for e-commerce features, but those are deferred until architecture is solid.

**Infrastructure Available:**
- MySQL: `mysql -u root -proot -h 127.0.0.1` (already running)
- Redis: available for caching (already running)
- Chrome MCP: available for service verification

## Constraints

- **Tech Stack:** Python FastAPI + React TypeScript (per project prompts)
- **Database:** MySQL (not SQLite — aligns with prompts spec)
- **Architecture:** Must support future AI agent integration
- **No Real Payments:** Demo only, no actual payment processing

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Phase 1 = Architecture only | Stable foundation enables faster iteration on features later | — Pending |
| MySQL over SQLite | Per project prompts spec; better for concurrent access simulation | — Pending |
|分层架构 (API→Service→Repo) | Separation enables AI to understand/intercept business logic | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-16 after initial project discussion*

# Canvas Icons Documentation

Welcome to the Canvas Icons documentation! This folder contains all project documentation organized for easy navigation.

---

## Quick Navigation

### Getting Started
- **[Quick Start](guides/setup/quick-start.md)** - Get up and running in 35 minutes
- **[API Keys Setup](guides/setup/api-keys.md)** - Configure Firebase, OpenAI, and Anthropic
- **[Development Environment](guides/setup/development-environment.md)** - Local dev setup

### Core Documentation
- **[Project Overview](guides/project-overview.md)** - High-level project description
- **[Tech Stack](guides/tech-stack.md)** - Technologies and frameworks
- **[User Flow](guides/user-flow.md)** - User experience and workflows

### Architecture & Design
- **[Architecture Overview](guides/overview.md)** - System architecture and design
- **[AI System](guides/ai-system.md)** - AI canvas agent architecture
- **[Firestore Schema](guides/firestore-schema.md)** - Database structure
- **[Design Tokens](guides/design-tokens.md)** - Design system variables
- **[Figma Patterns](guides/figma-patterns.md)** - Figma-inspired design patterns

### Active Development
- **[Creating Implementation Plans](guides/creating-implementation-plans.md)** - How to write task plans
- **[Task Plan Template](templates/task-plan-template.md)** - Reusable template
- **[Active Plans](plans/)** - Current implementation plans

---

## Folder Structure

```
_docs/
├── README.md                    # This file - start here!
│
├── guides/                      # Core documentation and guides
│   ├── project-overview.md      # Project description
│   ├── tech-stack.md            # Technologies used
│   ├── user-flow.md             # User experience flows
│   ├── overview.md              # Architecture overview
│   ├── ai-system.md             # AI agent architecture
│   ├── ai-development-log.md    # AI development notes
│   ├── firestore-schema.md      # Database schema
│   ├── founders-deal-config.md  # Founders pricing config
│   ├── design-tokens.md         # Design system tokens
│   ├── figma-patterns.md        # Figma-inspired patterns
│   ├── micro-interactions-catalog.md # UI animations
│   ├── theme-rules.md           # Theme guidelines
│   ├── ui-rules.md              # UI component rules
│   ├── project-rules.md         # Project conventions
│   ├── url-structure.md         # Routing structure
│   ├── realtime-db-vs-firestore.md # Database decision
│   ├── creating-implementation-plans.md # Plan creation guide
│   │
│   ├── research/                # Research notes and findings
│   │   ├── auth-flow.md
│   │   ├── canvas-sync-flow.md
│   │   ├── database-structure.md
│   │   ├── figma-lock-behavior.md
│   │   ├── firebase-architecture.md
│   │   ├── landing-page-inspiration.md
│   │   ├── lock-implementation-gaps.md
│   │   ├── routing-structure.md
│   │   └── tech-stack-audit.md
│   │
│   └── setup/                   # Setup and configuration
│       ├── quick-start.md       # Quick start checklist
│       ├── api-keys.md          # API keys setup
│       ├── development-environment.md
│       ├── complete-stripe-setup.md
│       ├── stripe-environment-setup.md
│       └── framer-shadcn-setup.md
│
├── templates/                   # Reusable templates
│   └── task-plan-template.md   # Implementation plan template
│
├── plans/                       # Implementation plans
│   ├── projectid-migrate.md    # Active: Multi-project support migration
│   └── archived/                # Completed/archived plans (21 files)
│
└── archive/                     # Historical documentation
    ├── completed-plans/         # Finished implementation plans
    ├── fixes/                   # Bug fix documentation
    ├── features/                # Archived feature docs
    │   ├── ai-canvas-agent.md
    │   ├── context-menu.md
    │   ├── export-system.md
    │   ├── grouping-system.md
    │   ├── hierarchy-system.md
    │   ├── lock-system.md
    │   └── z-index-system.md
    ├── phases/                  # Project phase documentation
    │   ├── phase-0-setup.md
    │   ├── phase-1-mvp.md
    │   ├── phase-2-enhanced.md
    │   └── phase-3-agent.md
    ├── stripe/                  # Stripe integration docs
    │   ├── deployment-checklist.md
    │   ├── products-and-prices.md
    │   └── webhook-setup-and-testing.md
    ├── testing/                 # Testing documentation
    │   ├── README.md
    │   ├── manual-testing-guide.md
    │   ├── mvp-command-verification.md
    │   ├── nested-grouping-tests.md
    │   ├── phase-6-test-report.md
    │   └── complex-command-test-login-form.md
    └── ux/                      # UX documentation
        ├── accessibility-checklist.md
        ├── empty-states.md
        ├── error-catalog.md
        ├── loading-patterns.md
        └── user-flows.md
```

---

## Documentation Best Practices

### For Developers
1. **Start here**: Read this README to understand the structure
2. **Architecture first**: Review `guides/overview.md` before coding
3. **Check guides**: Browse `guides/` for implementation patterns
4. **Create plans**: Use `templates/task-plan-template.md` for new features

### For Implementers
1. **Read the guide**: `guides/creating-implementation-plans.md`
2. **Copy template**: `templates/task-plan-template.md`
3. **Save in plans/**: New plans go in `_docs/plans/`
4. **Execute**: `/execute-plan @_docs/plans/your-plan.md`

### For Researchers
1. **Check existing research**: `guides/research/`
2. **Review decisions**: `guides/realtime-db-vs-firestore.md`
3. **Document findings**: Add new research to `guides/research/`

---

## Key Files

| File | Purpose | When to Use |
|------|---------|-------------|
| `guides/overview.md` | System architecture | Before major changes |
| `guides/ai-system.md` | AI agent architecture | Working with AI features |
| `guides/firestore-schema.md` | Database structure | Database changes |
| `guides/creating-implementation-plans.md` | Plan creation guide | Starting new features |
| `templates/task-plan-template.md` | Plan template | Creating implementation plans |
| `guides/setup/quick-start.md` | Setup checklist | First-time setup |
| `archive/features/hierarchy-system.md` | Parent-child docs | Working with hierarchies |
| `archive/features/lock-system.md` | Lock behavior | Working with locks |

---

## Archive Policy

Completed work is moved to `archive/` to keep the root clean:
- **Completed plans** → `plans/archived/` or `archive/completed-plans/`
- **Feature docs (MVP complete)** → `archive/features/`
- **Phase docs (completed)** → `archive/phases/`
- **Testing docs (historical)** → `archive/testing/`
- **UX docs (archived)** → `archive/ux/`
- **Bug fixes** → `archive/fixes/`

Historical documents remain accessible but don't clutter active development.

---

## Contributing to Documentation

### When to Create New Docs
- Implementation plans → `plans/`
- Research findings → `guides/research/`
- Setup guides → `guides/setup/`
- General guides → `guides/`
- Templates → `templates/`

### Documentation Standards
- Use Markdown with proper headings
- Include code examples where helpful
- Add "Why" explanations, not just "What"
- Link to related documents
- Keep files under 1000 lines (split if needed)

### File Naming
- Use kebab-case: `feature-name.md`
- Be descriptive: `lock-system.md` not `locks.md`
- Include dates in plans: `2025-01-14-feature-name.md`

---

## Current Active Work

### Active Plans
- **[ProjectId Migration](plans/projectid-migrate.md)** - Multi-project support (1/87 tasks complete)

### Recent Changes
- 2025-10-17: Reorganized documentation structure
- 2025-10-17: Archived completed plans (21 files)
- 2025-10-17: Consolidated guides into single folder

---

## Questions?

If you can't find what you're looking for:
1. Check this README's table of contents
2. Search the `guides/` folder for documentation
3. Check `archive/features/` for historical feature docs
4. Look in `archive/` for historical context

---

**Last Updated**: 2025-10-17
**Maintained By**: Development Team

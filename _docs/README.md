# CollabCanvas Documentation

Welcome to the CollabCanvas documentation! This folder contains all project documentation organized for easy navigation.

---

## Quick Navigation

### Getting Started
- **[Setup Guide](setup/quick-start.md)** - Get up and running in 35 minutes
- **[API Keys Setup](setup/api-keys.md)** - Configure OpenAI and Anthropic
- **[Development Environment](setup/development-environment.md)** - Local dev setup

### Core Documentation
- **[Project Overview](project-overview.md)** - High-level project description
- **[Tech Stack](tech-stack.md)** - Technologies and frameworks
- **[User Flow](user-flow.md)** - User experience and workflows

### Architecture
- **[Overview](architecture/overview.md)** - System architecture and design
- **[AI System](architecture/ai-system.md)** - AI canvas agent architecture

### Features
- **[AI Canvas Agent](features/ai-canvas-agent.md)** - Natural language interface
- **[Hierarchy System](features/hierarchy-system.md)** - Parent-child relationships
- **[Lock System](features/lock-system.md)** - Object locking behavior

### Development
- **[Creating Implementation Plans](guides/creating-implementation-plans.md)** - How to write task plans
- **[Task Plan Template](templates/task-plan-template.md)** - Reusable template
- **[Testing Guide](testing/README.md)** - Manual testing procedures

---

## Folder Structure

```
_docs/
├── README.md                    # This file - start here!
│
├── guides/                      # How-to guides for developers
│   └── creating-implementation-plans.md
│
├── templates/                   # Reusable templates
│   └── task-plan-template.md
│
├── architecture/                # System architecture docs
│   ├── overview.md              # Main architecture document
│   └── ai-system.md             # AI agent architecture
│
├── features/                    # Feature documentation
│   ├── ai-canvas-agent.md       # AI agent features
│   ├── hierarchy-system.md      # Parent-child system
│   └── lock-system.md           # Lock behavior
│
├── setup/                       # Setup and configuration
│   ├── quick-start.md           # Quick start checklist
│   ├── api-keys.md              # API keys setup
│   └── development-environment.md
│
├── testing/                     # Testing documentation
│   ├── README.md                # Testing overview
│   ├── manual-testing-guide.md  # Step-by-step tests
│   └── ...
│
├── phases/                      # Project phase documentation
│   ├── phase-0-setup.md         # Initial setup phase
│   ├── phase-1-mvp.md           # MVP phase
│   ├── phase-2-enhanced.md      # Enhanced features
│   └── phase-3-agent.md         # AI agent integration
│
├── plans/                       # Active implementation plans
│   ├── ai-redesign.md           # AI system redesign
│   └── ai-canvas-agent-integration.md
│
├── decisions/                   # Architecture Decision Records (ADRs)
│   └── realtime-db-vs-firestore.md
│
├── research/                    # Research notes and findings
│   ├── figma-lock-behavior.md
│   └── lock-implementation-gaps.md
│
├── examples/                    # Code examples
│   ├── hierarchy-examples.ts
│   └── lock-examples.ts
│
├── images/                      # Documentation images
│
└── archive/                     # Completed/historical docs
    ├── fixes/                   # Bug fix documentation
    └── completed-plans/         # Finished implementation plans
```

---

## Documentation Best Practices

### For Developers
1. **Start here**: Read this README to understand the structure
2. **Architecture first**: Review `architecture/overview.md` before coding
3. **Follow patterns**: Check `features/` for implementation patterns
4. **Create plans**: Use `templates/task-plan-template.md` for new features

### For Implementers
1. **Read the guide**: `guides/creating-implementation-plans.md`
2. **Copy template**: `templates/task-plan-template.md`
3. **Save in plans/**: New plans go in `_docs/plans/`
4. **Execute**: `/execute-plan @_docs/plans/your-plan.md`

### For Testers
1. **Start with**: `testing/README.md`
2. **Follow**: `testing/manual-testing-guide.md`
3. **Report results**: `testing/phase-6-test-report.md`

---

## Key Files

| File | Purpose | When to Use |
|------|---------|-------------|
| `architecture/overview.md` | System architecture | Before major changes |
| `features/hierarchy-system.md` | Parent-child docs | Working with hierarchies |
| `features/lock-system.md` | Lock behavior | Working with locks |
| `guides/creating-implementation-plans.md` | Plan creation guide | Starting new features |
| `templates/task-plan-template.md` | Plan template | Creating implementation plans |
| `setup/quick-start.md` | Setup checklist | First-time setup |
| `testing/README.md` | Testing overview | Before testing |

---

## Archive Policy

Completed work is moved to `archive/` to keep the root clean:
- **Completed plans** → `archive/completed-plans/`
- **Bug fixes** → `archive/fixes/`

Historical documents remain accessible but don't clutter active development.

---

## Contributing to Documentation

### When to Create New Docs
- New features → `features/`
- Architecture changes → `architecture/`
- Implementation plans → `plans/`
- Research findings → `research/`
- Major decisions → `decisions/` (use ADR format)

### Documentation Standards
- Use Markdown with proper headings
- Include code examples where helpful
- Add "Why" explanations, not just "What"
- Link to related documents
- Keep files under 500 lines (split if needed)

### File Naming
- Use kebab-case: `feature-name.md`
- Be descriptive: `lock-system.md` not `locks.md`
- Include dates in ADRs: `2025-01-14-decision-name.md`

---

## Questions?

If you can't find what you're looking for:
1. Check this README's table of contents
2. Search the `features/` folder for feature docs
3. Check `architecture/` for system design
4. Look in `archive/` for historical context

---

**Last Updated**: 2025-10-15
**Maintained By**: Development Team

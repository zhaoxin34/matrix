# Neo Frontend

AI Agent Platform Frontend built with Next.js 16, React 19, and Tailwind CSS 4.

## Tech Stack

- **Framework**: Next.js 16 (App Router + Turbopack)
- **UI**: React 19, shadcn/ui, Tailwind CSS 4
- **State**: Zustand
- **Icons**: hugeicons
- **Theme**: next-themes (dark mode support)
- **Recording**: rrweb

## Getting Started

```bash
# Install dependencies
pnpm install

# Start development server (port 3300)
pnpm dev

# Build for production
pnpm build

# Run linting
pnpm lint

# Format code
pnpm format

# Type checking
pnpm typecheck
```

## Project Structure

```
frontend/
├── app/           # Next.js App Router pages
├── components/    # React components
├── lib/           # Utilities and API client
├── stores/        # Zustand stores
├── hooks/         # Custom hooks
├── types/         # TypeScript types
└── mockdata/      # Mock data for development
```

## Modes

### Standalone Mode
Run as a standalone web application with `pnpm dev`.

### Embedded Mode
Can be embedded in an iframe for AI agent interaction.

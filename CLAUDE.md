# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

sedekah.je is a directory of QR codes for mosques, suraus, and other institutions in Malaysia. The project allows users to find and share QR codes for donation purposes. It's built with Next.js 14 and uses Drizzle ORM with PostgreSQL for database management.

## Common Development Commands

### Package Management
- Uses Bun as the package manager (enforced by `preinstall` script)
- Install dependencies: `bun install`

### Development
- Start development server: `bun dev` or `bun run dev`
- Build for production: `bun build`
- Start production server: `bun start`

### Code Quality
- Lint code: `bun run lint` (uses Biome)
- Format code: `bun run format` (uses Biome)
- Check code quality: `bun run check` (combines lint and format)
- Type checking: `bun run type-check`

### Database
- Seed database: `bun run db:seed`
- Truncate database: `bun run db:truncate`
- Database uses Drizzle ORM with PostgreSQL

### Other Commands
- Generate components: `bun run artisan:plop`
- Clean build artifacts: `bun run clean`

## Architecture

### Core Structure
- **Next.js 14 App Router** - Uses the app directory structure
- **Database**: PostgreSQL with Drizzle ORM
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack Query for server state
- **Maps**: React Leaflet for map functionality
- **QR Codes**: qrcode.react for QR code generation

### Key Directories
- `app/` - Next.js app router pages and API routes
- `components/` - Reusable React components
  - `ui/` - shadcn/ui components (should not be linted/formatted)
- `lib/` - Utility functions and configurations
- `hooks/` - Custom React hooks
- `actions/` - Server actions for GitHub integration
- `scripts/` - Utility scripts

### Data Management
- **Institution Data**: Located in `app/data/institutions.ts`
- **Types**: Institution types defined in `app/types/institutions.ts`
- **Categories**: mosque, surau, others (with specific colors and icons)
- **Payment Methods**: DuitNow, TNG, Boost support

### Code Style
- **Formatter**: Biome with tab indentation (2 spaces)
- **Line Width**: 80 characters
- **Semicolons**: Always required
- **Trailing Commas**: Always for JS/TS, never for JSON
- **Import Organization**: Enabled

### Testing
- No specific test framework is configured
- When adding tests, check the codebase for existing patterns

### Special Features
- QR code scanning and display
- Interactive map with institution locations
- State-based filtering using Malaysian state flags
- Responsive design with mobile drawer navigation
- OG image generation for social sharing
- Ramadan countdown functionality

## Important Notes

- Uses Bun package manager exclusively
- Biome handles both linting and formatting
- Database schema is managed with Drizzle
- Institution data includes coordinates for map display
- QR codes contain payment information for Malaysian payment systems
- Uses commit conventions with emoji support (git-cz)

## Development Workflow

1. Run `bun dev` to start development server
2. Make changes following existing patterns
3. Run `bun run check` to verify code quality
4. Run `bun run type-check` to verify TypeScript
5. Test database changes with seed/truncate commands
6. Use `bun run artisan:plop` to generate new components consistently
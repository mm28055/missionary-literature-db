# CLAUDE.md — Missionary Literature Database

## Project Overview

A scholarly web application for cataloguing and browsing historical missionary literature. Users can search/filter extracts (passages) from missionary works, while authenticated admins manage the full dataset via a CRUD dashboard.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19, CSS Modules, CSS Custom Properties |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email/password) |
| Fonts | Cormorant Garamond (headings), Inter (body) via Google Fonts |
| Package Manager | npm |

No TypeScript — project uses plain JavaScript with `jsconfig.json` path aliases (`@/*` → `./src/*`).

---

## Project Structure

```
src/
├── app/
│   ├── layout.js              # Root layout — loads Navbar/Footer, reads server auth session
│   ├── page.js                # Home page — hero, featured extracts
│   ├── about/page.js          # About page
│   ├── browse/page.js         # Legacy browse & search extracts (public)
│   ├── themes/
│   │   ├── page.js            # Themes index — 6 parent theme cards
│   │   ├── themes.module.css  # Shared styles for themes pages
│   │   ├── [slug]/
│   │   │   ├── page.js        # Theme detail — introduction + sub-theme cards
│   │   │   └── [subtheme]/
│   │   │       ├── page.js    # Sub-theme — layer tabs, paginated extracts
│   │   │       └── subtheme.module.css
│   ├── extract/
│   │   └── [id]/
│   │       ├── page.js        # Extract detail — full text, commentary, cross-links
│   │       └── extract.module.css
│   ├── login/
│   │   ├── page.js            # Login page wrapper
│   │   └── LoginForm.js       # Client component — signInWithPassword
│   └── admin/                 # Protected by middleware — requires auth
│       ├── page.js            # Admin dashboard
│       ├── LogoutButton.js    # Client component — signOut
│       ├── missionaries/page.js
│       ├── works/page.js
│       ├── extracts/page.js   # Includes tag assignment
│       ├── tags/page.js       # Includes scholarly introduction editor
│       └── denominations/page.js
├── components/
│   ├── Navbar.js / Navbar.module.css
│   └── Footer.js / Footer.module.css
├── lib/supabase/
│   ├── client.js              # createBrowserClient — for Client Components
│   └── server.js              # createServerClient (cookies) — for Server Components & middleware
└── middleware.js              # Guards /admin/* — redirects unauthenticated to /login
supabase/
└── migrations/
    ├── 001_initial_schema.sql  # Full schema + RLS + seed data
    ├── 002_taxonomy_upgrade.sql # Layers, commentary, extract_links, expanded taxonomy
    └── 003_theme_navigation.sql # Slug & introduction fields on tags
```

---

## Database Schema

All tables use UUID primary keys. Row Level Security (RLS) is enabled on all tables:
- **Public SELECT** — anyone can read
- **Authenticated INSERT/UPDATE/DELETE** — requires `auth.role() = 'authenticated'`

### Tables

**`denominations`**
- `id` UUID PK
- `name` TEXT UNIQUE
- `description` TEXT
- `created_at` TIMESTAMPTZ

**`missionaries`**
- `id` UUID PK
- `name` TEXT
- `bio` TEXT
- `birth_year` INT
- `death_year` INT
- `denomination_id` UUID FK → denominations
- `created_at` TIMESTAMPTZ

**`works`** — books, pamphlets, letters, reports
- `id` UUID PK
- `title` TEXT
- `year_published` INT
- `publisher` TEXT
- `bibliographic_info` TEXT
- `author` TEXT — for non-missionary sources (census, reform texts)
- `layer` TEXT DEFAULT 'missionary' — missionary | bureaucratic | reform
- `missionary_id` UUID FK → missionaries (CASCADE DELETE)
- `created_at` TIMESTAMPTZ

**`tags`** — hierarchical thematic taxonomy
- `id` UUID PK
- `name` TEXT UNIQUE
- `description` TEXT — scholarly context
- `tag_type` TEXT DEFAULT 'theme' — theme | strategy | source_type
- `parent_id` UUID FK → tags (CASCADE DELETE) — NULL = top-level parent
- `slug` TEXT UNIQUE — URL-friendly identifier for theme navigation
- `introduction` TEXT — full scholarly introduction displayed on theme pages
- `created_at` TIMESTAMPTZ
- 6 parent themes, ~37 sub-themes, 7 discursive strategies, 6 source types

**`extracts`** — core content: passages from works
- `id` UUID PK
- `content` TEXT
- `source_reference` TEXT — e.g., "Chapter 3, pp. 45–48"
- `notes` TEXT
- `layer` TEXT DEFAULT 'missionary' — missionary | bureaucratic | reform
- `commentary` TEXT — scholarly commentary
- `work_id` UUID FK → works (CASCADE DELETE)
- `created_at` / `updated_at` TIMESTAMPTZ
- `fts` tsvector GENERATED — full-text search vector (GIN indexed)

**`extract_tags`** — many-to-many junction
- `extract_id` UUID FK → extracts (CASCADE DELETE)
- `tag_id` UUID FK → tags (CASCADE DELETE)
- PK: (extract_id, tag_id)

**`extract_links`** — cross-references between extracts across layers
- `id` UUID PK
- `source_extract_id` UUID FK → extracts (CASCADE DELETE)
- `target_extract_id` UUID FK → extracts (CASCADE DELETE)
- `link_type` TEXT — influenced | adopted | codified | reacted_to
- `commentary` TEXT
- UNIQUE(source_extract_id, target_extract_id)

### Full-Text Search

Extracts support PostgreSQL FTS via a generated `tsvector` column (`fts`) indexed with GIN. Query via:
```js
supabase.from('extracts').select('...').textSearch('fts', query)
```

---

## Authentication

- **Method**: Supabase email/password (`signInWithPassword`)
- **Session**: Cookie-based, managed by `@supabase/ssr`
- **Protection**: `src/middleware.js` intercepts all `/admin/*` requests; redirects to `/login?redirect=<path>` if no session
- **Logout**: `supabase.auth.signOut()` in `LogoutButton.js`, then redirects to `/`
- **Admin link in Navbar**: conditionally shown when `user` prop is truthy (passed from server-side layout)
- **No RBAC**: single tier — authenticated = full admin write access

---

## Data Access Pattern

No API routes. All data is fetched directly via the Supabase JS SDK:

- **Server Components** use `src/lib/supabase/server.js` (`createServerClient` with Next.js cookies)
- **Client Components** use `src/lib/supabase/client.js` (`createBrowserClient`)

Both clients handle the case where env vars are not set (graceful fallback/mock).

---

## Environment Variables

Defined in `.env.local` (see `.env.local.example`):

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## Deployment

- Target platform: **Vercel** (`.gitignore` includes `.vercel/`)
- No Dockerfile, docker-compose, or CI/CD config present
- Run migrations in Supabase dashboard or via Supabase CLI before first deploy

### Scripts

```
npm run dev      # Development server
npm run build    # Production build
npm start        # Start production server
npm run lint     # ESLint
```

---

## Design System

- Background: `#faf8f5` (off-white, scholarly)
- Accent: `#b8843a` (warm gold)
- Headings: Cormorant Garamond (serif)
- Body: Inter (sans-serif)
- Styling via CSS Modules per component + global CSS custom properties in `globals.css`

---

## Key Conventions

- App Router (not Pages Router) — all routes are in `src/app/`
- Server Components by default; add `"use client"` only for interactive components
- Path alias `@/` maps to `src/` — use it for all internal imports
- No TypeScript — plain `.js` files throughout
- CSS Modules for component styles, named `ComponentName.module.css` alongside the component
